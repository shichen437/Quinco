use tauri::State;

use crate::application::workspace_use_case::WorkspaceUseCase;
use crate::infrastructure::repo_impl::ai_repo_impl::AiSessionRepoImpl;
use crate::infrastructure::repo_impl::document_repo_impl::DocumentRepoImpl;
use crate::infrastructure::repo_impl::tag_repo_impl::TagRepoImpl;
use crate::infrastructure::repo_impl::workspace_repo_impl::WorkspaceRepoImpl;
use crate::interfaces::dto::workspace::WorkspaceDto;
use crate::shared::error::DomainError;
use crate::shared::state::AppState;

type WorkspaceUseCaseCtx =
    WorkspaceUseCase<WorkspaceRepoImpl, DocumentRepoImpl, TagRepoImpl, AiSessionRepoImpl>;

fn build_use_case(state: &State<'_, AppState>) -> WorkspaceUseCaseCtx {
    WorkspaceUseCase::new(
        WorkspaceRepoImpl::new(state.db.clone()),
        DocumentRepoImpl::new(state.db.clone()),
        TagRepoImpl::new(state.db.clone()),
        AiSessionRepoImpl::new(state.db.clone()),
    )
}

#[tauri::command]
pub async fn get_all_workspaces(state: State<'_, AppState>) -> Result<Vec<WorkspaceDto>, String> {
    let use_case = build_use_case(&state);
    use_case
        .get_all_workspaces()
        .await
        .map(|ws| ws.into_iter().map(WorkspaceDto::from).collect())
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub async fn get_current_workspace(state: State<'_, AppState>) -> Result<WorkspaceDto, String> {
    let use_case = build_use_case(&state);
    use_case
        .get_current_workspace()
        .await
        .map(WorkspaceDto::from)
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub async fn switch_workspace(state: State<'_, AppState>, id: i64) -> Result<WorkspaceDto, String> {
    let use_case = build_use_case(&state);
    use_case
        .switch_workspace(id)
        .await
        .map(WorkspaceDto::from)
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub async fn create_workspace(
    state: State<'_, AppState>,
    name: String,
) -> Result<WorkspaceDto, String> {
    let use_case = build_use_case(&state);
    use_case
        .create_workspace(name)
        .await
        .map(WorkspaceDto::from)
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub async fn create_and_switch_workspace(
    state: State<'_, AppState>,
    name: String,
) -> Result<WorkspaceDto, String> {
    let use_case = build_use_case(&state);
    use_case
        .create_and_switch_workspace(name)
        .await
        .map(WorkspaceDto::from)
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub async fn delete_workspace(state: State<'_, AppState>, id: i64) -> Result<WorkspaceDto, String> {
    let use_case = build_use_case(&state);
    use_case
        .delete_workspace(id)
        .await
        .map(WorkspaceDto::from)
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub async fn rename_workspace(
    state: State<'_, AppState>,
    id: i64,
    name: String,
) -> Result<WorkspaceDto, String> {
    let use_case = build_use_case(&state);
    use_case
        .rename_workspace(id, name)
        .await
        .map(WorkspaceDto::from)
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub async fn reset_workspace(state: State<'_, AppState>, id: i64) -> Result<WorkspaceDto, String> {
    let use_case = build_use_case(&state);
    use_case
        .reset_workspace(id)
        .await
        .map(WorkspaceDto::from)
        .map_err(DomainError::into_api_json)
}
