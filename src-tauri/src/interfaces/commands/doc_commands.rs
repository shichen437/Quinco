use tauri::State;

use crate::application::doc_service;
use crate::domain::doc::{DocDetail, DocListItem, TrashDocItem};
use crate::shared::state::AppState;

#[tauri::command]
pub async fn doc_list_current_workspace(
    state: State<'_, AppState>,
) -> Result<Vec<DocListItem>, String> {
    Ok(doc_service::list_current_workspace(&state.db).await?)
}

#[tauri::command]
pub async fn doc_list_favorite_current_workspace(
    state: State<'_, AppState>,
) -> Result<Vec<DocListItem>, String> {
    Ok(doc_service::list_favorite_current_workspace(&state.db).await?)
}

#[tauri::command]
pub async fn doc_list_by_tag_current_workspace(
    tag_id: i64,
    state: State<'_, AppState>,
) -> Result<Vec<DocListItem>, String> {
    Ok(doc_service::list_by_tag_current_workspace(&state.db, tag_id).await?)
}

#[tauri::command]
pub async fn doc_quick_search(
    query: String,
    limit: i64,
    state: State<'_, AppState>,
) -> Result<Vec<DocListItem>, String> {
    Ok(doc_service::quick_search(&state.db, &query, limit).await?)
}

#[tauri::command]
pub async fn doc_get(id: String, state: State<'_, AppState>) -> Result<DocDetail, String> {
    Ok(doc_service::get(&state.db, &id).await?)
}

#[tauri::command]
pub async fn doc_create_current_workspace(state: State<'_, AppState>) -> Result<DocDetail, String> {
    Ok(doc_service::create_current_workspace(&state.db).await?)
}

#[tauri::command]
pub async fn doc_update_title(
    id: String,
    title: String,
    state: State<'_, AppState>,
) -> Result<DocDetail, String> {
    Ok(doc_service::update_title(&state.db, &id, &title).await?)
}

#[tauri::command]
pub async fn doc_update_emoji(
    id: String,
    emoji: String,
    state: State<'_, AppState>,
) -> Result<DocDetail, String> {
    Ok(doc_service::update_emoji(&state.db, &id, &emoji).await?)
}

#[tauri::command]
pub async fn doc_set_favorite(
    id: String,
    is_favorite: i64,
    state: State<'_, AppState>,
) -> Result<DocDetail, String> {
    Ok(doc_service::set_favorite(&state.db, &id, is_favorite).await?)
}

#[tauri::command]
pub async fn doc_set_lock(
    id: String,
    is_lock: i64,
    state: State<'_, AppState>,
) -> Result<DocDetail, String> {
    Ok(doc_service::set_lock(&state.db, &id, is_lock).await?)
}

#[tauri::command]
pub async fn doc_move_to_trash(id: String, state: State<'_, AppState>) -> Result<(), String> {
    Ok(doc_service::move_to_trash(&state.db, &id).await?)
}

#[tauri::command]
pub async fn doc_list_trash_current_workspace(
    state: State<'_, AppState>,
) -> Result<Vec<TrashDocItem>, String> {
    Ok(doc_service::list_trash_current_workspace(&state.db).await?)
}

#[tauri::command]
pub async fn doc_restore_from_trash(id: String, state: State<'_, AppState>) -> Result<(), String> {
    Ok(doc_service::restore_from_trash(&state.db, &id).await?)
}

#[tauri::command]
pub async fn doc_delete_permanently(id: String, state: State<'_, AppState>) -> Result<(), String> {
    Ok(doc_service::delete_permanently(&state.db, &id).await?)
}
