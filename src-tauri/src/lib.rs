mod application;
mod domain;
mod handler;
mod infra;
mod interfaces;
mod shared;

use application::file_service;
use handler::file_protocol;
use infra::db::init_sqlite_and_migrate;
use infra::store::init_store;
use shared::state::AppState;
use tauri::{Manager, RunEvent, WindowEvent};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .register_asynchronous_uri_scheme_protocol("quinco", file_protocol::handle)
        .setup(|app| {
            let pool = tauri::async_runtime::block_on(init_sqlite_and_migrate(app.handle()))?;
            file_service::register_pool(pool.clone());
            app.manage(AppState { db: pool });
            init_store(app.handle())?;
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
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(quinco_commands!())
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let RunEvent::Reopen { .. } = event {
                if let Some(window) = app_handle.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        });
}
