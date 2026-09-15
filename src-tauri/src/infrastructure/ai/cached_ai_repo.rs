use async_trait::async_trait;
use futures_util::future::join_all;
use tauri::AppHandle;

use crate::domain::ai::entity::{AIProvider, AiModel};
use crate::domain::ai::repo::{AiModelRepository, ProviderModels};
use crate::infrastructure::store_agent::get_api_key;
use crate::shared::error::DomainError;

use super::genai_cache;
use super::genai_client::GenAiClient;

pub struct CachedAiModelRepo {
    app: AppHandle,
}

impl CachedAiModelRepo {
    pub fn new(app: AppHandle) -> Self {
        Self { app }
    }

    fn load_cached(&self, provider: AIProvider) -> Result<Option<Vec<AiModel>>, DomainError> {
        Ok(genai_cache::load_cached_models(&self.app, provider))
    }

    fn save_cached(&self, provider: AIProvider, models: &[AiModel]) -> Result<(), DomainError> {
        genai_cache::save_cached_models(&self.app, provider, models).map_err(DomainError::Infra)
    }

    fn get_api_key(&self, provider: AIProvider) -> Option<String> {
        match get_api_key(&self.app, provider.as_str()) {
            Ok(key) => key,
            Err(e) => {
                tracing::warn!(
                    "读取 provider '{}' 的 API key 失败: {}",
                    provider.as_str(),
                    e
                );
                None
            }
        }
    }

    async fn fetch_one(&self, provider: AIProvider) -> Result<ProviderModels, DomainError> {
        if let Some(cached) = self.load_cached(provider)? {
            return Ok(ProviderModels {
                provider,
                models: cached,
            });
        }

        let api_key = self.get_api_key(provider);
        let models = match GenAiClient::new() {
            Ok(client) => {
                match client
                    .fetch_models_from_api(provider.as_str(), api_key.as_deref())
                    .await
                {
                    Ok(models) => {
                        if let Err(e) = self.save_cached(provider, &models) {
                            tracing::warn!(
                                "缓存 provider '{}' 模型列表失败: {}",
                                provider.as_str(),
                                e
                            );
                        }
                        models
                    }
                    Err(e) => {
                        tracing::warn!(
                            "Failed to list models for provider '{}': {}",
                            provider.as_str(),
                            e
                        );
                        vec![]
                    }
                }
            }
            Err(e) => {
                tracing::warn!("创建 genai client 失败: {}", e);
                vec![]
            }
        };

        Ok(ProviderModels { provider, models })
    }
}

#[async_trait]
impl AiModelRepository for CachedAiModelRepo {
    async fn list_models(
        &self,
        providers: &[AIProvider],
    ) -> Result<Vec<ProviderModels>, DomainError> {
        let futures = providers.iter().map(|&p| self.fetch_one(p));
        let results = join_all(futures).await;

        let mut ok_results = Vec::with_capacity(results.len());
        for result in results {
            match result {
                Ok(pm) => ok_results.push(pm),
                Err(e) => tracing::warn!("Failed to list models for a provider: {e}"),
            }
        }
        Ok(ok_results)
    }
}
