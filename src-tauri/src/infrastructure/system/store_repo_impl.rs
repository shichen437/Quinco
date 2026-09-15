use std::collections::HashMap;

use tauri::AppHandle;

use crate::domain::ai::entity::AIProvider;
use crate::domain::system::entity::{AppConfig, AppConfigUpdate};
use crate::domain::system::repo::ConfigRepository;
use crate::shared::error::DomainError;

use super::super::store;
use super::super::store_agent;

pub struct StoreRepoImpl<'a> {
    app: &'a AppHandle,
}

impl<'a> StoreRepoImpl<'a> {
    pub fn new(app: &'a AppHandle) -> Self {
        Self { app }
    }
}

impl ConfigRepository for StoreRepoImpl<'_> {
    fn get_config(&self) -> Result<AppConfig, DomainError> {
        store::get_config(self.app).map_err(DomainError::Infra)
    }

    fn set_config(&self, update: AppConfigUpdate) -> Result<AppConfig, DomainError> {
        store::set_config(self.app, update).map_err(DomainError::Infra)
    }

    fn set_api_key(&self, provider: AIProvider, api_key: &str) -> Result<(), DomainError> {
        store_agent::set_api_key(self.app, provider.as_str(), api_key).map_err(DomainError::Infra)
    }

    fn get_api_key(&self, provider: AIProvider) -> Result<Option<String>, DomainError> {
        store_agent::get_api_key(self.app, provider.as_str()).map_err(DomainError::Infra)
    }

    fn reset_api_key(&self, provider: AIProvider) -> Result<(), DomainError> {
        store_agent::reset_api_key(self.app, provider.as_str()).map_err(DomainError::Infra)
    }

    fn get_all_api_key_status(&self) -> Result<HashMap<AIProvider, bool>, DomainError> {
        let raw = store_agent::get_all_api_key_status(self.app).map_err(DomainError::Infra)?;
        let mut result = HashMap::new();
        for (key, value) in raw {
            if let Some(provider) = AIProvider::from_str(&key) {
                result.insert(provider, value);
            }
        }
        Ok(result)
    }
}
