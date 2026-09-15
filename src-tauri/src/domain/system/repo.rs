use std::collections::HashMap;

use async_trait::async_trait;

use crate::domain::ai::entity::AIProvider;
use crate::domain::system::entity::{AppConfig, AppConfigUpdate, SystemInfo};
use crate::shared::error::DomainError;

pub trait ConfigRepository: Send + Sync {
    fn get_config(&self) -> Result<AppConfig, DomainError>;

    fn set_config(&self, update: AppConfigUpdate) -> Result<AppConfig, DomainError>;

    fn set_api_key(&self, provider: AIProvider, api_key: &str) -> Result<(), DomainError>;

    fn get_api_key(&self, provider: AIProvider) -> Result<Option<String>, DomainError>;

    fn reset_api_key(&self, provider: AIProvider) -> Result<(), DomainError>;

    fn get_all_api_key_status(&self) -> Result<HashMap<AIProvider, bool>, DomainError>;
}

#[async_trait]
pub trait SystemRepository: Send + Sync {
    async fn get_disk_usage(&self) -> Result<SystemInfo, DomainError>;
}
