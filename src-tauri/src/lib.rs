mod application;
mod domain;
mod infrastructure;
mod interfaces;
mod macros;
mod shared;

use crate::domain::events::ApiKeyEvent;
use application::handlers::event_handlers::ApiKeyEventHandler;
use infrastructure::ai::genai_cache::GenAiModelCache;
use infrastructure::event_bus::BroadcastEventBus;

use infrastructure::db::init_sqlite_and_migrate;
use infrastructure::store::init_store;
use infrastructure::store_agent::init_store as init_agent_store;
use shared::state::AppState;
use tauri::{Manager, RunEvent, WindowEvent};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            let pool = tauri::async_runtime::block_on(init_sqlite_and_migrate(app.handle()))?;
            app.manage(AppState::new(pool));
            init_store(app.handle())?;
            init_agent_store(app.handle())?;

            let event_bus = BroadcastEventBus::<ApiKeyEvent>::new(16);
            let model_cache = GenAiModelCache::new(app.handle().clone());
            ApiKeyEventHandler::spawn(event_bus.clone(), model_cache);
            app.manage(event_bus);

            if let Some(window) = app.get_webview_window("main") {
                let window_clone = window.clone();
                window.on_window_event(move |event| {
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = window_clone.hide();
                    }
                });
            }
            Ok(())
        })
        .invoke_handler(quinco_commands!())
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| {
        if let RunEvent::Reopen { .. } = event {
            if let Some(window) = app_handle.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
    });
}
