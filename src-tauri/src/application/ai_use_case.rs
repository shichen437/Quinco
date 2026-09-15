use crate::domain::ai::entity::{AIProvider, AiChatSession, AiSessionData, NewAiChatSession};
use crate::domain::ai::repo::{AiModelRepository, AiSessionRepository, ProviderModels};
use crate::shared::error::DomainError;

pub struct AiUseCase<R, S> {
    repo: R,
    session_repo: S,
}

impl<R: AiModelRepository, S: AiSessionRepository> AiUseCase<R, S> {
    pub fn new(repo: R, session_repo: S) -> Self {
        Self { repo, session_repo }
    }

    pub async fn list_all_models(
        &self,
        providers: &[AIProvider],
    ) -> Result<Vec<ProviderModels>, DomainError> {
        self.repo.list_models(providers).await
    }

    pub async fn create_session(
        &self,
        session: NewAiChatSession,
    ) -> Result<AiChatSession, DomainError> {
        self.session_repo.create_session(session).await
    }

    pub async fn list_sessions(&self, wid: i64) -> Result<Vec<AiChatSession>, DomainError> {
        self.session_repo.list_sessions(wid).await
    }

    pub async fn get_session_data(&self, sid: &str) -> Result<AiSessionData, DomainError> {
        let session = self.session_repo.get_session(sid).await?;
        let messages = self.session_repo.list_messages(sid).await?;
        Ok(AiSessionData { session, messages })
    }

    pub async fn delete_session(&self, sid: &str) -> Result<(), DomainError> {
        self.session_repo.delete_session(sid).await
    }
}
