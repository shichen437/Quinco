use std::collections::HashSet;
use std::sync::{Arc, LazyLock, Mutex};

use serde::de::DeserializeOwned;
use serde::Serialize;
use tauri::{AppHandle, Wry};
use tauri_plugin_store::{Store, StoreExt};

use crate::domain::ai::entity::{AIProvider, AiModel};
use crate::domain::ai::repo::ModelCachePort;

use super::genai_client::GenAiClient;

static IN_FLIGHT: LazyLock<Mutex<HashSet<AIProvider>>> =
    LazyLock::new(|| Mutex::new(HashSet::new()));

fn load_store(app: &AppHandle) -> Result<Arc<Store<Wry>>, String> {
    app.store(crate::infrastructure::store_agent::store_name())
        .map_err(|e| e.to_string())
}

fn get_typed<T: DeserializeOwned>(app: &AppHandle, key: &str) -> Option<T> {
    load_store(app)
        .ok()?
        .get(key)
        .and_then(|value| serde_json::from_value(value).ok())
}

fn set_typed<S>(app: &AppHandle, key: &str, value: &S) -> Result<(), String>
where
    S: Serialize + ?Sized,
{
    let store = load_store(app)?;
    store.set(key, serde_json::to_value(value).map_err(|e| e.to_string())?);
    store.save().map_err(|e| e.to_string())
}

fn remove_key(app: &AppHandle, key: &str) {
    if let Ok(store) = load_store(app) {
        if store.has(key) {
            store.delete(key);
            let _ = store.save();
        }
    }
}

fn model_cache_key(provider: AIProvider) -> String {
    format!("providers.{}.models", provider.as_str())
}

pub fn load_cached_models(app: &AppHandle, provider: AIProvider) -> Option<Vec<AiModel>> {
    get_typed(app, &model_cache_key(provider))
}

pub fn save_cached_models(
    app: &AppHandle,
    provider: AIProvider,
    models: &[AiModel],
) -> Result<(), String> {
    set_typed(app, &model_cache_key(provider), models)
}

pub fn clear_cached_models(app: &AppHandle, provider: AIProvider) {
    remove_key(app, &model_cache_key(provider));
}

fn is_in_flight(provider: AIProvider) -> bool {
    IN_FLIGHT
        .lock()
        .map(|set| set.contains(&provider))
        .unwrap_or(false)
}

fn mark_in_flight(provider: AIProvider) -> bool {
    IN_FLIGHT
        .lock()
        .map(|mut set| set.insert(provider))
        .unwrap_or(false)
}

fn clear_in_flight(provider: AIProvider) {
    if let Ok(mut set) = IN_FLIGHT.lock() {
        set.remove(&provider);
    }
}

pub fn refresh_provider_models(app: AppHandle, provider: AIProvider) {
    if is_in_flight(provider) {
        tracing::debug!("provider '{}' 正在刷新中，跳过", provider.as_str());
        return;
    }
    if !mark_in_flight(provider) {
        return;
    }
    let provider_stable = provider;
    tauri::async_runtime::spawn(async move {
        do_refresh(&app, provider_stable).await;
        clear_in_flight(provider_stable);
    });
}

async fn do_refresh(app: &AppHandle, provider: AIProvider) {
    let api_key = match crate::infrastructure::store_agent::get_api_key(app, provider.as_str()) {
        Ok(key) => key,
        Err(e) => {
            tracing::warn!(
                "读取 provider '{}' 的 API key 失败: {}",
                provider.as_str(),
                e
            );
            None
        }
    };

    match GenAiClient::new() {
        Ok(client) => match client
            .fetch_models_from_api(provider.as_str(), api_key.as_deref())
            .await
        {
            Ok(models) => {
                if let Err(e) = save_cached_models(app, provider, &models) {
                    tracing::warn!("缓存 provider '{}' 模型列表失败: {}", provider.as_str(), e);
                }
            }
            Err(e) => {
                tracing::warn!("刷新 provider '{}' 模型缓存失败: {}", provider.as_str(), e);
            }
        },
        Err(e) => {
            tracing::warn!("创建 genai client 失败: {}", e);
        }
    }
}

pub struct GenAiModelCache {
    app: AppHandle,
}

impl GenAiModelCache {
    pub fn new(app: AppHandle) -> Self {
        Self { app }
    }
}

impl ModelCachePort for GenAiModelCache {
    fn clear_models(&self, provider: AIProvider) {
        clear_cached_models(&self.app, provider);
    }

    fn refresh_models(&self, provider: AIProvider) {
        refresh_provider_models(self.app.clone(), provider);
    }
}
