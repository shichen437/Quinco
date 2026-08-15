use tauri::State;

use crate::application::tag_service;
use crate::domain::tag::TagItem;
use crate::shared::state::AppState;

#[tauri::command]
pub async fn tag_list_current_workspace(
    state: State<'_, AppState>,
) -> Result<Vec<TagItem>, String> {
    Ok(tag_service::list_current_workspace(&state.db).await?)
}

#[tauri::command]
pub async fn tag_create_current_workspace(
    name: String,
    state: State<'_, AppState>,
) -> Result<TagItem, String> {
    Ok(tag_service::create_current_workspace(&state.db, &name).await?)
}

#[tauri::command]
pub async fn tag_update_current_workspace(
    id: i64,
    name: String,
    state: State<'_, AppState>,
) -> Result<TagItem, String> {
    Ok(tag_service::update_current_workspace(&state.db, id, &name).await?)
}

#[tauri::command]
pub async fn tag_delete_current_workspace(
    id: i64,
    state: State<'_, AppState>,
) -> Result<(), String> {
    Ok(tag_service::delete_current_workspace(&state.db, id).await?)
}

#[tauri::command]
pub async fn doc_list_tags(id: String, state: State<'_, AppState>) -> Result<Vec<TagItem>, String> {
    Ok(tag_service::list_doc_tags(&state.db, &id).await?)
}

#[tauri::command]
pub async fn doc_attach_tag(
    id: String,
    tag_id: i64,
    state: State<'_, AppState>,
) -> Result<(), String> {
    Ok(tag_service::attach_tag(&state.db, &id, tag_id).await?)
}

#[tauri::command]
pub async fn doc_detach_tag(
    id: String,
    tag_id: i64,
    state: State<'_, AppState>,
) -> Result<(), String> {
    Ok(tag_service::detach_tag(&state.db, &id, tag_id).await?)
}
