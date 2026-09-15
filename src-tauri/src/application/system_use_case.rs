use std::collections::HashMap;

use crate::domain::ai::entity::AIProvider;
use crate::domain::events::api_key_events::ApiKeyEvent;
use crate::domain::events::EventBus;
use crate::domain::system::entity::{AppConfig, AppConfigUpdate};
use crate::domain::system::repo::{ConfigRepository, SystemRepository};
use crate::shared::error::DomainError;

pub struct SystemUseCase<C, S, B> {
    config_repo: C,
    system_repo: S,
    event_bus: B,
}

impl<C, S, B> SystemUseCase<C, S, B>
where
    C: ConfigRepository,
    S: SystemRepository,
    B: EventBus<ApiKeyEvent>,
{
    pub fn new(config_repo: C, system_repo: S, event_bus: B) -> Self {
        Self {
            config_repo,
            system_repo,
            event_bus,
        }
    }

    pub fn get_config(&self) -> Result<AppConfig, DomainError> {
        self.config_repo.get_config()
    }

    pub fn set_config(&self, update: AppConfigUpdate) -> Result<AppConfig, DomainError> {
        self.config_repo.set_config(update)
    }

    pub fn set_api_key(&self, provider: AIProvider, api_key: &str) -> Result<(), DomainError> {
        self.config_repo.set_api_key(provider, api_key)?;
        self.event_bus.send(ApiKeyEvent::KeySet { provider });
        Ok(())
    }

    pub fn get_api_key(&self, provider: AIProvider) -> Result<Option<String>, DomainError> {
        self.config_repo.get_api_key(provider)
    }

    pub fn reset_api_key(&self, provider: AIProvider) -> Result<(), DomainError> {
        self.config_repo.reset_api_key(provider)?;
        self.event_bus.send(ApiKeyEvent::KeyReset { provider });
        Ok(())
    }

    pub fn get_all_api_key_status(&self) -> Result<HashMap<AIProvider, bool>, DomainError> {
        self.config_repo.get_all_api_key_status()
    }

    pub async fn get_system_info(
        &self,
    ) -> Result<crate::domain::system::entity::SystemInfo, DomainError> {
        self.system_repo.get_disk_usage().await
    }
}
