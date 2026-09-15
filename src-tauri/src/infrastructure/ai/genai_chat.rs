use genai::adapter::AdapterKind;
use genai::chat::{ChatMessage, ChatOptions, ChatRequest, ChatStreamResponse};
use genai::resolver::{AuthData, AuthResolver};
use genai::{Client, ModelIden, ModelSpec};
use tauri::AppHandle;

use crate::domain::ai::entity::AIProvider;
use crate::infrastructure::store_agent::get_api_key;
use crate::shared::error::DomainError;

pub struct ChatStreamer {
    app: AppHandle,
}

impl ChatStreamer {
    pub fn new(app: AppHandle) -> Self {
        Self { app }
    }

    fn adapter_kind_for(provider: AIProvider) -> AdapterKind {
        match provider {
            AIProvider::Anthropic => AdapterKind::Anthropic,
            AIProvider::DeepSeek => AdapterKind::DeepSeek,
            AIProvider::Gemini => AdapterKind::Gemini,
            AIProvider::Moonshot => AdapterKind::Moonshot,
            AIProvider::OpenAI => AdapterKind::OpenAI,
            AIProvider::Zhipu => AdapterKind::BigModel,
        }
    }

    fn build_client_for_key(&self, api_key: String) -> Result<Client, DomainError> {
        let owned_key = api_key.clone();
        let auth_resolver = AuthResolver::from_resolver_fn(move |_iden| {
            Ok(Some(AuthData::from_single(owned_key.clone())))
        });
        Client::builder()
            .with_auth_resolver(auth_resolver)
            .build()
            .map_err(|e| DomainError::Infra(e.to_string()))
    }

    fn get_api_key(&self, provider: AIProvider) -> Result<String, DomainError> {
        get_api_key(&self.app, provider.as_str())
            .map_err(|e| DomainError::Infra(e.to_string()))?
            .ok_or_else(|| {
                DomainError::Validation(format!(
                    "No API key configured for provider '{}'. Please set it in settings first.",
                    provider.as_str()
                ))
            })
    }

    pub async fn stream(
        &self,
        provider: AIProvider,
        model: &str,
        user_message: &str,
    ) -> Result<ChatStreamResponse, DomainError> {
        let api_key = self.get_api_key(provider)?;
        let client = self.build_client_for_key(api_key)?;

        let chat_req = ChatRequest::new(vec![ChatMessage::user(user_message.to_string())]);

        let options = ChatOptions::default().with_capture_usage(true);

        let model_iden = ModelIden::new(Self::adapter_kind_for(provider), model);
        client
            .exec_chat_stream(ModelSpec::from_iden(model_iden), chat_req, Some(&options))
            .await
            .map_err(|e| DomainError::Infra(e.to_string()))
    }
}
