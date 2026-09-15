use std::path::Path;
use std::sync::Arc;

use async_trait::async_trait;
use serde::Deserialize;
use tauri::{AppHandle, Manager};

use crate::domain::ai::entity::AIProvider;
use crate::infrastructure::ai::genai_cache;
use crate::infrastructure::store_agent::get_api_key;

#[derive(Debug, Deserialize)]
struct AiModelsConfig {
    models: Vec<ProviderEntry>,
}

#[derive(Debug, Deserialize)]
struct ProviderEntry {
    provider: String,
    #[serde(default)]
    models: Vec<String>,
}

#[async_trait]
pub trait AiModelResolver: Send + Sync {
    async fn resolve_auto(&self) -> Option<(AIProvider, String)>;
}

#[derive(Clone)]
pub struct AiGateway {
    app: AppHandle,
    recommended: Arc<Vec<(AIProvider, Vec<String>)>>,
}

impl AiGateway {
    const DEFAULT_CONFIG_TOML: &str = include_str!("../../../config/ai_models.toml");

    pub fn new(app: AppHandle) -> Self {
        let recommended = Self::load_config(&app);
        Self {
            app,
            recommended: Arc::new(recommended),
        }
    }

    fn load_config(app: &AppHandle) -> Vec<(AIProvider, Vec<String>)> {
        let candidates = [
            app.path()
                .app_config_dir()
                .ok()
                .map(|p| p.join("ai_models.toml")),
            app.path()
                .resource_dir()
                .ok()
                .map(|p| p.join("config/ai_models.toml")),
        ];

        for path in candidates.iter().flatten() {
            if path.exists() {
                if let Some(list) = Self::parse_file(path) {
                    tracing::info!(target: "ai_gateway", path = %path.display(), "loaded ai_models.toml from file");
                    return list;
                }
            }
        }

        match Self::parse_toml_str(Self::DEFAULT_CONFIG_TOML) {
            Some(list) => {
                tracing::info!(target: "ai_gateway", "loaded ai_models.toml from embedded defaults");
                list
            }
            None => {
                tracing::error!(target: "ai_gateway", "failed to parse embedded default config — no recommended models available");
                Vec::new()
            }
        }
    }

    fn parse_file(path: &Path) -> Option<Vec<(AIProvider, Vec<String>)>> {
        let content = std::fs::read_to_string(path).ok()?;
        Self::parse_toml_str(&content)
    }

    fn parse_toml_str(content: &str) -> Option<Vec<(AIProvider, Vec<String>)>> {
        let parsed: AiModelsConfig = toml::from_str(content).ok()?;
        let list = parsed
            .models
            .into_iter()
            .filter_map(|entry| {
                let provider = AIProvider::from_str(&entry.provider)?;
                if entry.models.is_empty() {
                    None
                } else {
                    Some((provider, entry.models))
                }
            })
            .collect::<Vec<_>>();
        if list.is_empty() {
            None
        } else {
            Some(list)
        }
    }

    fn api_key_configured(&self, provider: AIProvider) -> bool {
        matches!(get_api_key(&self.app, provider.as_str()), Ok(Some(_)))
    }
}

#[async_trait]
impl AiModelResolver for AiGateway {
    async fn resolve_auto(&self) -> Option<(AIProvider, String)> {
        for (provider, candidates) in self.recommended.iter() {
            let provider = *provider;
            if !self.api_key_configured(provider) {
                continue;
            }

            let cached = genai_cache::load_cached_models(&self.app, provider);

            if let Some(cached_list) = &cached {
                for model_name in candidates {
                    if cached_list.iter().any(|m| &m.name == model_name) {
                        return Some((provider, model_name.clone()));
                    }
                }
                if let Some(first) = cached_list.first() {
                    return Some((provider, first.name.clone()));
                }
            } else {
                if let Some(first) = candidates.first() {
                    return Some((provider, first.clone()));
                }
            }
        }
        None
    }
}

pub type SharedAiResolver = Arc<dyn AiModelResolver>;

pub fn make_default_resolver(app: AppHandle) -> SharedAiResolver {
    Arc::new(AiGateway::new(app))
}
