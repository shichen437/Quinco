use sys_locale::get_locale;
use tauri_plugin_store::StoreExt;

use crate::domain::system::entity::{AppConfig, AppConfigUpdate};

const STORE_NAME: &str = "quinco_store.json";
const SETTINGS_THEME: &str = "settings.theme";
const SETTINGS_LANG: &str = "settings.lang";
const SETTINGS_LAST_TAB: &str = "settings.lastTab";
const SETTINGS_AI_ENABLED: &str = "settings.aiEnabled";
const SETTINGS_OPEN_TABS: &str = "settings.openTabs";

pub fn init_store(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let store = app.store(STORE_NAME)?;

    if store.get(SETTINGS_THEME).is_none() {
        store.set(SETTINGS_THEME, "system");
    }

    if store.get(SETTINGS_LANG).is_none() {
        store.set(SETTINGS_LANG, get_system_language());
    }

    if store.get(SETTINGS_LAST_TAB).is_none() {
        store.set(SETTINGS_LAST_TAB, "");
    }

    if store.get(SETTINGS_AI_ENABLED).is_none() {
        store.set(SETTINGS_AI_ENABLED, "false");
    }

    if store.get(SETTINGS_OPEN_TABS).is_none() {
        store.set(SETTINGS_OPEN_TABS, "");
    }

    store.save()?;

    Ok(())
}

fn load_store(
    app: &tauri::AppHandle,
) -> Result<std::sync::Arc<tauri_plugin_store::Store<tauri::Wry>>, String> {
    app.store(STORE_NAME).map_err(|e| e.to_string())
}

pub fn get_config(app: &tauri::AppHandle) -> Result<AppConfig, String> {
    let store = load_store(app)?;

    let theme = store
        .get(SETTINGS_THEME)
        .and_then(|v| v.as_str().map(String::from))
        .unwrap_or_else(|| "system".to_string());

    let lang = store
        .get(SETTINGS_LANG)
        .and_then(|v| v.as_str().map(String::from))
        .unwrap_or_else(|| "en".to_string());

    let last_tab = store
        .get(SETTINGS_LAST_TAB)
        .and_then(|v| v.as_str().map(String::from))
        .unwrap_or_default();

    let ai_enabled = match store.get(SETTINGS_AI_ENABLED) {
        Some(serde_json::Value::Bool(b)) => b,
        Some(serde_json::Value::String(s)) => s == "true",
        _ => false,
    };

    let open_tabs = store
        .get(SETTINGS_OPEN_TABS)
        .and_then(|v| v.as_str().map(String::from))
        .unwrap_or_default();

    Ok(AppConfig {
        theme,
        lang,
        last_tab,
        ai_enabled,
        open_tabs,
    })
}

pub fn set_config(app: &tauri::AppHandle, update: AppConfigUpdate) -> Result<AppConfig, String> {
    let store = load_store(app)?;

    if let Some(theme) = update.theme {
        store.set(SETTINGS_THEME, theme);
    }
    if let Some(lang) = update.lang {
        store.set(SETTINGS_LANG, lang);
    }
    if let Some(last_tab) = update.last_tab {
        store.set(SETTINGS_LAST_TAB, last_tab);
    }
    if let Some(ai_enabled) = update.ai_enabled {
        store.set(SETTINGS_AI_ENABLED, ai_enabled);
    }
    if let Some(open_tabs) = update.open_tabs {
        store.set(SETTINGS_OPEN_TABS, open_tabs);
    }

    store.save().map_err(|e| e.to_string())?;

    get_config(app)
}

fn get_system_language() -> String {
    let supported_langs = ["zh", "en"];

    get_locale()
        .and_then(|locale| locale.split('-').next().map(String::from))
        .map(|lang| {
            if supported_langs.contains(&lang.as_str()) {
                lang
            } else {
                "en".to_string()
            }
        })
        .unwrap_or_else(|| "en".to_string())
}
