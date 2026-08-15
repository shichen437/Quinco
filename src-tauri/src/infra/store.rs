use sys_locale::get_locale;
use tauri_plugin_store::StoreExt;

const STORE_NAME: &str = "quinco_store.json";
const SETTINGS_THEME: &str = "settings.theme";
const SETTINGS_LANG: &str = "settings.lang";
const SETTINGS_LAST_TAB: &str = "settings.lastTab";

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

    store.save()?;

    Ok(())
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
