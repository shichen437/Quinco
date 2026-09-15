use serde::{Deserialize, Serialize};

use crate::domain::ai::entity::{AiChatMessage, AiChatSession, AiModel, AiSessionData};
use crate::domain::ai::repo::ProviderModels;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfoDto {
    pub name: String,
    pub adapter_kind: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct ProviderModelsDto {
    pub provider: String,
    pub models: Vec<ModelInfoDto>,
}

impl From<AiModel> for ModelInfoDto {
    fn from(m: AiModel) -> Self {
        Self {
            name: m.name,
            adapter_kind: m.adapter_kind,
        }
    }
}

impl From<ProviderModels> for ProviderModelsDto {
    fn from(p: ProviderModels) -> Self {
        Self {
            provider: p.provider.as_str().to_string(),
            models: p.models.into_iter().map(ModelInfoDto::from).collect(),
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct ChatStreamReq {
    pub provider: Option<String>,
    pub model: Option<String>,
    pub message: String,
    pub sid: String,
    pub wid: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum StreamEvent {
    Chunk { content: String },
    Reasoning { content: String },
    Done { usage: Option<UsageDto> },
    Error { message: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageDto {
    pub prompt_tokens: Option<i32>,
    pub completion_tokens: Option<i32>,
    pub total_tokens: Option<i32>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ChatSessionDto {
    pub id: String,
    pub title: String,
    pub model: String,
    pub provider: String,
    pub wid: i64,
    pub created_at: Option<chrono::NaiveDateTime>,
    pub updated_at: Option<chrono::NaiveDateTime>,
}

impl From<AiChatSession> for ChatSessionDto {
    fn from(s: AiChatSession) -> Self {
        Self {
            id: s.id,
            title: s.title,
            model: s.model,
            provider: s.provider,
            wid: s.wid,
            created_at: s.created_at,
            updated_at: s.updated_at,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct ChatMessageDto {
    pub id: i64,
    pub sid: String,
    pub role: String,
    pub content: String,
    pub created_at: Option<chrono::NaiveDateTime>,
}

impl From<AiChatMessage> for ChatMessageDto {
    fn from(m: AiChatMessage) -> Self {
        Self {
            id: m.id,
            sid: m.sid,
            role: m.role,
            content: m.content,
            created_at: m.created_at,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct ChatSessionDetailDto {
    pub session: ChatSessionDto,
    pub messages: Vec<ChatMessageDto>,
}

impl From<AiSessionData> for ChatSessionDetailDto {
    fn from(d: AiSessionData) -> Self {
        Self {
            session: d.session.into(),
            messages: d.messages.into_iter().map(ChatMessageDto::from).collect(),
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct CreateChatSessionReq {
    pub wid: i64,
    pub provider: String,
    pub model: String,
    pub title: Option<String>,
}
