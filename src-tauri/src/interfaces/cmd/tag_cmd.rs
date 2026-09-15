use tauri::State;

use crate::application::tag_use_case::TagUseCase;
use crate::infrastructure::repo_impl::tag_repo_impl::TagRepoImpl;
use crate::interfaces::dto::tag::TagDto;
use crate::shared::error::DomainError;
use crate::shared::state::AppState;

#[tauri::command]
pub async fn get_workspace_tags(
    state: State<'_, AppState>,
    wid: i64,
) -> Result<Vec<TagDto>, String> {
    let repo = TagRepoImpl::new(state.db.clone());
    let use_case = TagUseCase::new(repo);
    use_case
        .get_workspace_tags(wid)
        .await
        .map(|tags| tags.into_iter().map(TagDto::from).collect())
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub async fn get_doc_tags(
    state: State<'_, AppState>,
    doc_id: String,
) -> Result<Vec<TagDto>, String> {
    let repo = TagRepoImpl::new(state.db.clone());
    let use_case = TagUseCase::new(repo);
    use_case
        .get_doc_tags(&doc_id)
        .await
        .map(|tags| tags.into_iter().map(TagDto::from).collect())
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub async fn add_tag_to_doc(
    state: State<'_, AppState>,
    wid: i64,
    doc_id: String,
    tag_name: String,
    color: String,
) -> Result<TagDto, String> {
    let repo = TagRepoImpl::new(state.db.clone());
    let use_case = TagUseCase::new(repo);
    use_case
        .add_tag_to_doc(wid, &doc_id, &tag_name, &color)
        .await
        .map(TagDto::from)
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub async fn remove_tag_from_doc(
    state: State<'_, AppState>,
    doc_id: String,
    tid: i64,
) -> Result<(), String> {
    let repo = TagRepoImpl::new(state.db.clone());
    let use_case = TagUseCase::new(repo);
    use_case
        .remove_tag_from_doc(&doc_id, tid)
        .await
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub async fn update_tag(
    state: State<'_, AppState>,
    tid: i64,
    tag_name: String,
    color: String,
) -> Result<TagDto, String> {
    let repo = TagRepoImpl::new(state.db.clone());
    let use_case = TagUseCase::new(repo);
    use_case
        .update_tag(tid, &tag_name, &color)
        .await
        .map(TagDto::from)
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub async fn delete_tag(state: State<'_, AppState>, tid: i64) -> Result<(), String> {
    let repo = TagRepoImpl::new(state.db.clone());
    let use_case = TagUseCase::new(repo);
    use_case
        .delete_tag(tid)
        .await
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub async fn get_tag_docs(state: State<'_, AppState>, tid: i64) -> Result<Vec<String>, String> {
    let repo = TagRepoImpl::new(state.db.clone());
    let use_case = TagUseCase::new(repo);
    use_case
        .get_tag_doc_ids(tid)
        .await
        .map_err(DomainError::into_api_json)
}
