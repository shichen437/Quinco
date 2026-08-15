use tauri::State;

use crate::application::doc_content_service;
use crate::domain::doc::DocWithContent;
use crate::shared::state::AppState;

#[tauri::command]
pub async fn doc_update_content(
    id: String,
    content: String,
    plain_text: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    Ok(doc_content_service::update_content(&state.db, &id, &content, &plain_text).await?)
}

#[tauri::command]
pub async fn doc_get_with_content(
    id: String,
    state: State<'_, AppState>,
) -> Result<DocWithContent, String> {
    Ok(doc_content_service::get_with_content(&state.db, &id).await?)
}
