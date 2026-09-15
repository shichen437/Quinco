use chrono::NaiveDateTime;
use serde::de::{self, Visitor};
use serde::{Deserialize, Serialize};
use std::fmt;
use uuid::Uuid;

use crate::shared::error::DomainError;

impl<'de> Deserialize<'de> for AIProvider {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: de::Deserializer<'de>,
    {
        struct AIProviderVisitor;
        impl Visitor<'_> for AIProviderVisitor {
            type Value = AIProvider;
            fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
                write!(
                    formatter,
                    "one of: anthropic/claude, deepseek, gemini/google, moonshot/kimi, openai/chatgpt/gpt, zhipu/glm"
                )
            }
            fn visit_str<E>(self, value: &str) -> Result<AIProvider, E>
            where
                E: de::Error,
            {
                AIProvider::from_str(value).ok_or_else(|| {
                    de::Error::unknown_variant(
                        value,
                        &[
                            "anthropic",
                            "claude",
                            "deepseek",
                            "gemini",
                            "google",
                            "moonshot",
                            "kimi",
                            "openai",
                            "chatgpt",
                            "gpt",
                            "zhipu",
                            "glm",
                        ],
                    )
                })
            }
        }
        deserializer.deserialize_str(AIProviderVisitor)
    }
}

impl serde::Serialize for AIProvider {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(self.as_str())
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum AIProvider {
    Anthropic,
    DeepSeek,
    Gemini,
    Moonshot,
    OpenAI,
    Zhipu,
}

impl AIProvider {
    pub fn all() -> &'static [AIProvider] {
        &[
            AIProvider::Anthropic,
            AIProvider::DeepSeek,
            AIProvider::Gemini,
            AIProvider::Moonshot,
            AIProvider::OpenAI,
            AIProvider::Zhipu,
        ]
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            AIProvider::Anthropic => "claude",
            AIProvider::DeepSeek => "deepseek",
            AIProvider::Gemini => "gemini",
            AIProvider::Moonshot => "moonshot",
            AIProvider::OpenAI => "openai",
            AIProvider::Zhipu => "zhipu",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        let s = s.to_lowercase();
        match s.as_str() {
            "anthropic" | "claude" => Some(AIProvider::Anthropic),
            "deepseek" => Some(AIProvider::DeepSeek),
            "gemini" | "google" => Some(AIProvider::Gemini),
            "moonshot" | "kimi" => Some(AIProvider::Moonshot),
            "openai" | "chatgpt" | "gpt" => Some(AIProvider::OpenAI),
            "zhipu" | "glm" => Some(AIProvider::Zhipu),
            _ => None,
        }
    }

    pub fn parse(s: &str) -> Result<Self, crate::shared::error::DomainError> {
        Self::from_str(s).ok_or_else(|| {
            crate::shared::error::DomainError::validation(format!("unknown provider: {}", s))
        })
    }

    pub fn model_filter(&self) -> fn(&str) -> bool {
        filters::get_filter_fn(*self)
    }

    pub fn is_auto(s: &str) -> bool {
        let s = s.trim();
        s.is_empty() || s.eq_ignore_ascii_case("auto")
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct AiModel {
    pub name: String,
    pub adapter_kind: String,
}

const EXCLUDED_GEMINI_MODEL_KEYWORDS: &[&str] = &[
    "embedding",
    "image",
    "latest",
    "preview",
    "transcribe",
    "tts",
    "omni",
];

mod filters {
    use super::AIProvider;

    pub fn gemini_model_filter(model_name: &str) -> bool {
        let name = model_name.to_lowercase();
        if !name.starts_with("gemini-") {
            return false;
        }
        for exclude in super::EXCLUDED_GEMINI_MODEL_KEYWORDS {
            if name.contains(exclude) {
                return false;
            }
        }
        true
    }

    pub fn default_filter(_model_name: &str) -> bool {
        true
    }

    pub fn get_filter_fn(provider: AIProvider) -> fn(&str) -> bool {
        match provider {
            AIProvider::Gemini => gemini_model_filter,
            _ => default_filter,
        }
    }
}

#[derive(Debug, Clone)]
pub struct AiChatSession {
    pub id: String,
    pub title: String,
    pub model: String,
    pub provider: String,
    pub wid: i64,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone)]
pub struct AiChatMessage {
    pub id: i64,
    pub sid: String,
    pub role: String,
    pub content: String,
    pub created_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone)]
pub struct AiSessionData {
    pub session: AiChatSession,
    pub messages: Vec<AiChatMessage>,
}

#[derive(Debug, Clone)]
pub struct NewAiChatSession {
    id: String,
    title: String,
    model: String,
    provider: String,
    wid: i64,
}

impl NewAiChatSession {
    pub fn new(
        model: impl Into<String>,
        provider: impl Into<String>,
        wid: i64,
        title: impl Into<String>,
    ) -> Result<Self, DomainError> {
        let model = model.into();
        let provider = provider.into();
        let model = if model.trim().is_empty() {
            "auto".to_string()
        } else {
            model
        };
        let provider = if provider.trim().is_empty() {
            "auto".to_string()
        } else {
            provider
        };
        Ok(Self {
            id: Uuid::new_v4().to_string(),
            title: title.into().trim().to_string(),
            model,
            provider,
            wid,
        })
    }

    pub fn id(&self) -> &str {
        &self.id
    }

    pub fn title(&self) -> &str {
        &self.title
    }

    pub fn model(&self) -> &str {
        &self.model
    }

    pub fn provider(&self) -> &str {
        &self.provider
    }

    pub fn wid(&self) -> i64 {
        self.wid
    }
}

#[derive(Debug, Clone)]
pub struct NewAiChatMessage {
    sid: String,
    role: String,
    content: String,
}

impl NewAiChatMessage {
    pub fn new(
        sid: impl Into<String>,
        role: impl Into<String>,
        content: impl Into<String>,
    ) -> Result<Self, DomainError> {
        let role = role.into();
        let content = content.into();
        if role != "user" && role != "assistant" {
            return Err(DomainError::validation(format!(
                "Invalid chat message role: {}",
                role
            )));
        }
        if content.trim().is_empty() {
            return Err(DomainError::validation(
                "Chat message content cannot be empty",
            ));
        }
        Ok(Self {
            sid: sid.into(),
            role,
            content,
        })
    }

    pub fn sid(&self) -> &str {
        &self.sid
    }

    pub fn role(&self) -> &str {
        &self.role
    }

    pub fn content(&self) -> &str {
        &self.content
    }
}
