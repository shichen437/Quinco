use async_trait::async_trait;

use crate::domain::ai::entity::{
    AIProvider, AiChatMessage, AiChatSession, AiModel, NewAiChatMessage, NewAiChatSession,
};
use crate::shared::error::DomainError;

#[derive(Debug, Clone)]
pub struct ProviderModels {
    pub provider: AIProvider,
    pub models: Vec<AiModel>,
}

#[async_trait]
pub trait AiModelRepository: Send + Sync {
    async fn list_models(
        &self,
        providers: &[AIProvider],
    ) -> Result<Vec<ProviderModels>, DomainError>;
}

#[async_trait]
pub trait AiSessionRepository: Send + Sync {
    async fn delete_all_by_workspace(&self, wid: i64) -> Result<(), DomainError>;

    async fn create_session(&self, session: NewAiChatSession)
        -> Result<AiChatSession, DomainError>;

    async fn get_session(&self, sid: &str) -> Result<AiChatSession, DomainError>;

    async fn list_sessions(&self, wid: i64) -> Result<Vec<AiChatSession>, DomainError>;

    async fn delete_session(&self, sid: &str) -> Result<(), DomainError>;

    async fn append_message(&self, message: NewAiChatMessage)
        -> Result<AiChatMessage, DomainError>;

    async fn list_messages(&self, sid: &str) -> Result<Vec<AiChatMessage>, DomainError>;

    async fn update_session_model(
        &self,
        sid: &str,
        provider: &str,
        model: &str,
    ) -> Result<(), DomainError>;
}

pub trait ModelCachePort: Send + Sync + 'static {
    fn clear_models(&self, provider: AIProvider);
    fn refresh_models(&self, provider: AIProvider);
}
