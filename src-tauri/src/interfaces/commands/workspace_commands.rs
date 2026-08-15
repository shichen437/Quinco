use tauri::State;

use crate::application::workspace_service;
use crate::domain::workspace::Workspace;
use crate::shared::state::AppState;

#[tauri::command]
pub async fn workspace_list(state: State<'_, AppState>) -> Result<Vec<Workspace>, String> {
    Ok(workspace_service::list(&state.db).await?)
}

#[tauri::command]
pub async fn workspace_current(state: State<'_, AppState>) -> Result<Option<Workspace>, String> {
    Ok(workspace_service::current(&state.db).await?)
}

#[tauri::command]
pub async fn workspace_create(
    name: String,
    state: State<'_, AppState>,
) -> Result<Workspace, String> {
    Ok(workspace_service::create(&state.db, &name).await?)
}

#[tauri::command]
pub async fn workspace_get(id: i64, state: State<'_, AppState>) -> Result<Workspace, String> {
    Ok(workspace_service::get(&state.db, id).await?)
}

#[tauri::command]
pub async fn workspace_update(
    id: i64,
    name: String,
    state: State<'_, AppState>,
) -> Result<Workspace, String> {
    Ok(workspace_service::update(&state.db, id, &name).await?)
}

#[tauri::command]
pub async fn workspace_delete(id: i64, state: State<'_, AppState>) -> Result<(), String> {
    Ok(workspace_service::delete(&state.db, id).await?)
}

#[tauri::command]
pub async fn workspace_switch(id: i64, state: State<'_, AppState>) -> Result<Workspace, String> {
    Ok(workspace_service::switch(&state.db, id).await?)
}
