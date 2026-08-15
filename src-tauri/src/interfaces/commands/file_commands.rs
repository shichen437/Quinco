use tauri::{AppHandle, State};

use crate::application::file_service;
use crate::shared::state::AppState;

#[tauri::command]
pub async fn file_upload(
    bytes: Vec<u8>,
    filename: String,
    mime_type: String,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<String, String> {
    Ok(file_service::upload(&app, &state.db, &bytes, &filename, &mime_type).await?)
}
