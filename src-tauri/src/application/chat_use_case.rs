use std::collections::HashSet;
use std::sync::{Arc, Mutex};

use futures_util::StreamExt;
use genai::chat::ChatStreamEvent;
use tauri::AppHandle;

use crate::domain::ai::entity::{AIProvider, NewAiChatMessage};
use crate::domain::ai::repo::AiSessionRepository;
use crate::infrastructure::ai::ai_gateway::SharedAiResolver;
use crate::infrastructure::ai::genai_chat::ChatStreamer;
use crate::interfaces::dto::ai::{StreamEvent, UsageDto};
use crate::shared::error::DomainError;

type ActiveStreams = Arc<Mutex<HashSet<String>>>;

pub struct ChatStreamUseCase<R: AiSessionRepository> {
    streamer: ChatStreamer,
    session_repo: R,
    resolver: SharedAiResolver,
}

impl<R: AiSessionRepository> ChatStreamUseCase<R> {
    pub fn new(app: AppHandle, session_repo: R, resolver: SharedAiResolver) -> Self {
        Self {
            streamer: ChatStreamer::new(app),
            session_repo,
            resolver,
        }
    }

    pub async fn execute(
        &self,
        provider: Option<String>,
        model: Option<&str>,
        message: String,
        channel: tauri::ipc::Channel<StreamEvent>,
        sid: String,
        wid: i64,
        active_streams: &ActiveStreams,
    ) -> Result<(), DomainError> {
        let (session_provider, session_model, stream_provider, stream_model) =
            self.resolve_provider_model(provider, model).await?;

        self.validate_session(&sid, wid).await?;

        self.update_session_model_if_changed(&sid, &session_provider, &session_model)
            .await?;

        self.session_repo
            .append_message(NewAiChatMessage::new(&sid, "user", &message)?)
            .await?;

        let (full_reply, last_err, disconnected) = self
            .relay_stream_events(
                stream_provider,
                stream_model,
                message,
                &channel,
                &sid,
                active_streams,
            )
            .await?;

        if let Some(err) = last_err {
            channel
                .send(StreamEvent::Error {
                    message: "Internal server error".to_string(),
                })
                .ok();
            return Err(err);
        }

        if disconnected {
            return Ok(());
        }

        if !full_reply.trim().is_empty() {
            self.session_repo
                .append_message(NewAiChatMessage::new(&sid, "assistant", full_reply)?)
                .await?;
        }

        Ok(())
    }

    async fn resolve_provider_model(
        &self,
        provider: Option<String>,
        model: Option<&str>,
    ) -> Result<(String, String, AIProvider, String), DomainError> {
        let is_auto = match (&provider, model) {
            (Some(p), Some(m)) => AIProvider::is_auto(p) || AIProvider::is_auto(m),
            _ => true,
        };

        if is_auto {
            let (resolved_provider, resolved_model) = self
                .resolver
                .resolve_auto()
                .await
                .ok_or_else(|| {
                    DomainError::validation(
                        "No AI provider available. Please configure an API key or select a provider manually.",
                    )
                })?;
            Ok((
                "auto".to_string(),
                "auto".to_string(),
                resolved_provider,
                resolved_model,
            ))
        } else {
            let p = provider.unwrap();
            let p_parsed = AIProvider::parse(&p)?;
            let m = model.unwrap().to_string();
            Ok((p.clone(), m.clone(), p_parsed, m))
        }
    }

    async fn validate_session(&self, sid: &str, wid: i64) -> Result<(), DomainError> {
        let session = self.session_repo.get_session(sid).await?;
        if session.wid != wid {
            return Err(DomainError::not_found(format!("Chat session #{sid}")));
        }
        Ok(())
    }

    async fn update_session_model_if_changed(
        &self,
        sid: &str,
        provider: &str,
        model: &str,
    ) -> Result<(), DomainError> {
        let current = self.session_repo.get_session(sid).await?;
        if current.provider == provider && current.model == model {
            return Ok(());
        }
        self.session_repo
            .update_session_model(sid, provider, model)
            .await
    }

    async fn relay_stream_events(
        &self,
        stream_provider: AIProvider,
        stream_model: String,
        message: String,
        channel: &tauri::ipc::Channel<StreamEvent>,
        sid: &str,
        active_streams: &ActiveStreams,
    ) -> Result<(String, Option<DomainError>, bool), DomainError> {
        let chat_res = self
            .streamer
            .stream(stream_provider, &stream_model, &message)
            .await?;
        let mut stream = chat_res.stream;
        let mut full_reply = String::new();
        let mut last_err: Option<DomainError> = None;
        let mut disconnected = false;

        while let Some(result) = stream.next().await {
            let still_active = active_streams
                .lock()
                .map(|set| set.contains(sid))
                .unwrap_or(false);
            if !still_active {
                disconnected = true;
                break;
            }

            match result {
                Ok(event) => match event {
                    ChatStreamEvent::Chunk(c) => {
                        full_reply.push_str(&c.content);
                        if channel
                            .send(StreamEvent::Chunk { content: c.content })
                            .is_err()
                        {
                            disconnected = true;
                            break;
                        }
                    }
                    ChatStreamEvent::ReasoningChunk(c) => {
                        if channel
                            .send(StreamEvent::Reasoning { content: c.content })
                            .is_err()
                        {
                            disconnected = true;
                            break;
                        }
                    }
                    ChatStreamEvent::End(end) => {
                        let usage = end.captured_usage.map(|u| UsageDto {
                            prompt_tokens: u.prompt_tokens,
                            completion_tokens: u.completion_tokens,
                            total_tokens: u.total_tokens,
                        });
                        if channel.send(StreamEvent::Done { usage }).is_err() {
                            disconnected = true;
                            break;
                        }
                    }
                    _ => {}
                },
                Err(e) => {
                    last_err = Some(DomainError::infra(e));
                    break;
                }
            }
        }

        Ok((full_reply, last_err, disconnected))
    }
}
