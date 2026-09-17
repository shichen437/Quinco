use tauri::State;

use crate::application::document_use_case::DocumentUseCase;
use crate::infrastructure::repo_impl::document_repo_impl::DocumentRepoImpl;
use crate::interfaces::dto::document::{DocExtDto, DocumentDto, GraphDataDto};
use crate::interfaces::dto::page::Paginated;
use crate::shared::error::DomainError;
use crate::shared::state::AppState;

#[tauri::command]
pub async fn get_document(state: State<'_, AppState>, id: String) -> Result<DocumentDto, String> {
    let repo = DocumentRepoImpl::new(state.db.clone());
    let use_case = DocumentUseCase::new(repo);
    use_case
        .get_document(&id)
        .await
        .map(DocumentDto::from)
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub async fn get_workspace_documents(
    state: State<'_, AppState>,
    wid: i64,
    page: i64,
    page_size: i64,
) -> Result<Paginated<DocumentDto>, String> {
    let repo = DocumentRepoImpl::new(state.db.clone());
    let use_case = DocumentUseCase::new(repo);
    use_case
        .get_workspace_documents_paged(wid, page, page_size)
        .await
        .map(|p| Paginated {
            items: p.items.into_iter().map(DocumentDto::from).collect(),
            total: p.total,
            page: p.page,
            page_size: p.page_size,
        })
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub async fn create_document(
    state: State<'_, AppState>,
    wid: i64,
    title: Option<String>,
) -> Result<DocumentDto, String> {
    let repo = DocumentRepoImpl::new(state.db.clone());
    let use_case = DocumentUseCase::new(repo);
    use_case
        .create_document(wid, title.as_deref())
        .await
        .map(DocumentDto::from)
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub async fn update_document_title(
    state: State<'_, AppState>,
    doc_id: String,
    title: String,
) -> Result<(), String> {
    let repo = DocumentRepoImpl::new(state.db.clone());
    let use_case = DocumentUseCase::new(repo);
    use_case
        .update_title(&doc_id, &title)
        .await
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub async fn update_document_content(
    state: State<'_, AppState>,
    doc_id: String,
    content: String,
    plain_text: String,
) -> Result<(), String> {
    let repo = DocumentRepoImpl::new(state.db.clone());
    let use_case = DocumentUseCase::new(repo);
    use_case
        .update_content(&doc_id, &content, &plain_text)
        .await
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub async fn get_document_content(
    state: State<'_, AppState>,
    doc_id: String,
) -> Result<DocExtDto, String> {
    let repo = DocumentRepoImpl::new(state.db.clone());
    let use_case = DocumentUseCase::new(repo);
    use_case
        .get_content(&doc_id)
        .await
        .map(DocExtDto::from)
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub async fn soft_delete_document(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let repo = DocumentRepoImpl::new(state.db.clone());
    let use_case = DocumentUseCase::new(repo);
    use_case
        .soft_delete(&id)
        .await
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub async fn restore_document(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let repo = DocumentRepoImpl::new(state.db.clone());
    let use_case = DocumentUseCase::new(repo);
    use_case
        .restore(&id)
        .await
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub async fn hard_delete_document(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let repo = DocumentRepoImpl::new(state.db.clone());
    let use_case = DocumentUseCase::new(repo);
    use_case
        .hard_delete(&id)
        .await
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub async fn toggle_favorite_document(
    state: State<'_, AppState>,
    id: String,
) -> Result<i64, String> {
    let repo = DocumentRepoImpl::new(state.db.clone());
    let use_case = DocumentUseCase::new(repo);
    use_case
        .toggle_favorite(&id)
        .await
        .map(|v| v as i64)
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub async fn get_favorite_documents(
    state: State<'_, AppState>,
    wid: i64,
) -> Result<Vec<DocumentDto>, String> {
    let repo = DocumentRepoImpl::new(state.db.clone());
    let use_case = DocumentUseCase::new(repo);
    use_case
        .get_favorites(wid)
        .await
        .map(|docs| docs.into_iter().map(DocumentDto::from).collect())
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub async fn get_deleted_documents(
    state: State<'_, AppState>,
    wid: i64,
    page: i64,
    page_size: i64,
) -> Result<Paginated<DocumentDto>, String> {
    let repo = DocumentRepoImpl::new(state.db.clone());
    let use_case = DocumentUseCase::new(repo);
    use_case
        .get_deleted_paged(wid, page, page_size)
        .await
        .map(|p| Paginated {
            items: p.items.into_iter().map(DocumentDto::from).collect(),
            total: p.total,
            page: p.page,
            page_size: p.page_size,
        })
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub async fn toggle_lock_document(state: State<'_, AppState>, id: String) -> Result<i64, String> {
    let repo = DocumentRepoImpl::new(state.db.clone());
    let use_case = DocumentUseCase::new(repo);
    use_case
        .toggle_lock(&id)
        .await
        .map(|v| v as i64)
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub async fn get_recent_documents(
    state: State<'_, AppState>,
    wid: i64,
    page_size: i64,
) -> Result<Vec<DocumentDto>, String> {
    let repo = DocumentRepoImpl::new(state.db.clone());
    let use_case = DocumentUseCase::new(repo);
    use_case
        .get_recent_documents(wid, page_size)
        .await
        .map(|docs| docs.into_iter().map(DocumentDto::from).collect())
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub async fn doc_search(
    state: State<'_, AppState>,
    wid: i64,
    keyword: String,
    page_size: i64,
) -> Result<Vec<DocumentDto>, String> {
    let repo = DocumentRepoImpl::new(state.db.clone());
    let use_case = DocumentUseCase::new(repo);
    use_case
        .doc_search(wid, &keyword, page_size)
        .await
        .map(|docs| docs.into_iter().map(DocumentDto::from).collect())
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub async fn get_backlinks(
    state: State<'_, AppState>,
    doc_id: String,
) -> Result<Vec<DocumentDto>, String> {
    let repo = DocumentRepoImpl::new(state.db.clone());
    let use_case = DocumentUseCase::new(repo);
    use_case
        .get_backlinks(&doc_id)
        .await
        .map(|docs| docs.into_iter().map(DocumentDto::from).collect())
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub async fn get_graph_data(state: State<'_, AppState>, wid: i64) -> Result<GraphDataDto, String> {
    let repo = DocumentRepoImpl::new(state.db.clone());
    let use_case = DocumentUseCase::new(repo);
    use_case
        .get_graph_data(wid)
        .await
        .map(GraphDataDto::from)
        .map_err(DomainError::into_api_json)
}
