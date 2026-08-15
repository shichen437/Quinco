use tauri::State;

use crate::application::doc_link_service;
use crate::domain::doc::DocListItem;
use crate::domain::doc_link::{DocBidirectionalLinks, GraphData};
use crate::shared::state::AppState;

#[tauri::command]
pub async fn doc_list_bidirectional_links(
    id: String,
    state: State<'_, AppState>,
) -> Result<DocBidirectionalLinks, String> {
    Ok(doc_link_service::list_bidirectional_links(&state.db, &id).await?)
}

#[tauri::command]
pub async fn doc_search_reference_candidates(
    query: String,
    limit: i64,
    exclude_id: Option<String>,
    state: State<'_, AppState>,
) -> Result<Vec<DocListItem>, String> {
    Ok(doc_link_service::search_reference_candidates(
        &state.db,
        &query,
        limit,
        exclude_id.as_deref(),
    )
    .await?)
}

#[tauri::command]
pub async fn doc_link_upsert(
    source_doc_id: String,
    target_doc_id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    Ok(doc_link_service::upsert(&state.db, &source_doc_id, &target_doc_id).await?)
}

#[tauri::command]
pub async fn doc_link_delete(
    source_doc_id: String,
    target_doc_id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    Ok(doc_link_service::delete(&state.db, &source_doc_id, &target_doc_id).await?)
}

#[tauri::command]
pub async fn doc_graph_data(state: State<'_, AppState>) -> Result<GraphData, String> {
    Ok(doc_link_service::get_graph_data(&state.db).await?)
}
