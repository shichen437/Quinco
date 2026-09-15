use std::collections::HashMap;
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

use crate::domain::ai::entity::AIProvider;

use super::crypto;

const STORE_NAME: &str = "quinco_store_agent.json";

pub fn store_name() -> &'static str {
    STORE_NAME
}

pub fn init_store(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let store = app.store(STORE_NAME)?;

    for provider in AIProvider::all() {
        let status_key = format!("providers.{}.apikey.status", provider.as_str());
        if store.get(&status_key).is_none() {
            store.set(&status_key, false);
        }
    }
    store.save()?;

    Ok(())
}

fn key_for(provider: &str) -> String {
    format!("providers.{}.apikey", provider)
}

fn status_key_for(provider: &str) -> String {
    format!("providers.{}.apikey.status", provider)
}

fn load_store(
    app: &AppHandle,
) -> Result<std::sync::Arc<tauri_plugin_store::Store<tauri::Wry>>, String> {
    app.store(STORE_NAME).map_err(|e| e.to_string())
}

fn validate_provider(provider_str: &str) -> Result<(), String> {
    AIProvider::parse(provider_str)
        .map(|_| ())
        .map_err(|e| e.to_string())
}

fn normalize_provider(provider_str: &str) -> Result<String, String> {
    AIProvider::from_str(provider_str)
        .map(|p| p.as_str().to_string())
        .ok_or_else(|| format!("unknown provider: {}", provider_str))
}

pub fn set_api_key(app: &AppHandle, provider_str: &str, api_key: &str) -> Result<(), String> {
    validate_provider(provider_str)?;
    let provider = normalize_provider(provider_str)?;
    let store = load_store(app)?;
    let encrypted = crypto::encrypt(api_key).map_err(|e| e.to_string())?;
    store.set(key_for(&provider), encrypted);
    store.set(status_key_for(&provider), true);
    store.save().map_err(|e| e.to_string())?;

    Ok(())
}

pub fn get_api_key(app: &AppHandle, provider_str: &str) -> Result<Option<String>, String> {
    validate_provider(provider_str)?;
    let provider = normalize_provider(provider_str)?;
    let store = load_store(app)?;
    let value = store.get(key_for(&provider));
    match value {
        Some(serde_json::Value::String(encrypted)) => {
            let decrypted = crypto::decrypt(&encrypted).map_err(|e| e.to_string())?;
            Ok(Some(decrypted))
        }
        _ => Ok(None),
    }
}

pub fn reset_api_key(app: &AppHandle, provider_str: &str) -> Result<(), String> {
    validate_provider(provider_str)?;
    let provider = normalize_provider(provider_str)?;
    let store = load_store(app)?;
    let key = key_for(&provider);
    if store.has(&key) {
        store.delete(&key);
    }
    store.set(status_key_for(&provider), false);
    store.save().map_err(|e| e.to_string())?;

    Ok(())
}

pub fn get_all_api_key_status(app: &AppHandle) -> Result<HashMap<String, bool>, String> {
    let store = load_store(app)?;
    let mut result = HashMap::new();
    for provider in AIProvider::all() {
        let status_key = format!("providers.{}.apikey.status", provider.as_str());
        let status = store
            .get(&status_key)
            .and_then(|v| v.as_bool())
            .unwrap_or(false);
        result.insert(provider.as_str().to_string(), status);
    }
    Ok(result)
}
