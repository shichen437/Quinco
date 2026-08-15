use std::collections::BTreeSet;

use serde_json::Value;
use sqlx::SqlitePool;

use crate::domain::doc::ensure_editable;
use crate::domain::doc_link::{
    parse_doc_id, DocBidirectionalLinks, GraphData, ReferenceCandidates, ReferenceSearchCriteria,
    DOC_PROTOCOL_PREFIX,
};
use crate::domain::error::DomainError;
use crate::infra::repositories::{doc_link_repo, doc_repo, workspace_repo};

pub async fn list_bidirectional_links(
    db: &SqlitePool,
    id: &str,
) -> Result<DocBidirectionalLinks, DomainError> {
    if !doc_repo::exists(db, id).await? {
        return Err(DomainError::not_found("document"));
    }

    let reverse_links = doc_link_repo::list_reverse_links(db, id).await?;

    Ok(DocBidirectionalLinks { reverse_links })
}

pub async fn get_graph_data(db: &SqlitePool) -> Result<GraphData, DomainError> {
    let wid = workspace_repo::current_workspace_id(db).await?;
    doc_link_repo::list_graph_data(db, wid).await
}

pub async fn search_reference_candidates(
    db: &SqlitePool,
    query: &str,
    limit: i64,
    exclude_id: Option<&str>,
) -> Result<ReferenceCandidates, DomainError> {
    let wid = workspace_repo::current_workspace_id(db).await?;
    let criteria = ReferenceSearchCriteria::new(query, limit);

    if criteria.is_empty() {
        return doc_repo::recent_candidates(db, wid, criteria.limit, exclude_id).await;
    }

    doc_repo::search_candidates(db, wid, &criteria.keyword, criteria.limit, exclude_id).await
}

pub async fn upsert(
    db: &SqlitePool,
    source_doc_id: &str,
    target_doc_id: &str,
) -> Result<(), DomainError> {
    let mut tx = db.begin().await.map_err(DomainError::infra)?;

    let (source_wid, source_lock) = doc_repo::wid_and_lock(&mut *tx, source_doc_id)
        .await?
        .ok_or_else(|| DomainError::subject_not_found("source", "document"))?;

    if source_lock == 1 {
        return Err(DomainError::locked());
    }

    let target_wid = doc_repo::wid_of(&mut *tx, target_doc_id)
        .await?
        .ok_or_else(|| DomainError::subject_not_found("target", "document"))?;

    if source_wid != target_wid {
        return Err(DomainError::validation(
            "documents are not in the same workspace",
        ));
    }

    doc_link_repo::upsert(&mut *tx, source_doc_id, target_doc_id, source_wid).await?;
    doc_repo::touch_updated_at(&mut *tx, source_doc_id).await?;

    tx.commit().await.map_err(DomainError::infra)?;
    Ok(())
}

pub async fn delete(
    db: &SqlitePool,
    source_doc_id: &str,
    target_doc_id: &str,
) -> Result<(), DomainError> {
    let mut tx = db.begin().await.map_err(DomainError::infra)?;

    let lock_flag = doc_repo::lock_flag(&mut *tx, source_doc_id).await?;
    ensure_editable(lock_flag, Some("source"))?;

    doc_link_repo::delete_link(&mut *tx, source_doc_id, target_doc_id).await?;
    doc_repo::touch_updated_at(&mut *tx, source_doc_id).await?;

    tx.commit().await.map_err(DomainError::infra)?;
    Ok(())
}

/// 遍历内容 JSON，提取 quincoDoc 内联引用中的（去重）目标文档 id 集合。
pub fn extract_doc_refs(content: &str) -> Vec<String> {
    let mut ids = BTreeSet::new();
    if let Ok(value) = serde_json::from_str::<Value>(content) {
        walk_blocks(&value, &mut ids);
    }
    ids.into_iter().collect()
}

fn walk_blocks(value: &Value, ids: &mut BTreeSet<String>) {
    match value {
        Value::Array(items) => {
            for item in items {
                walk_blocks(item, ids);
            }
        }
        Value::Object(map) => {
            if map.get("type").and_then(Value::as_str) == Some("quincoDoc") {
                let doc_id = map
                    .get("props")
                    .and_then(|props| props.get("docId"))
                    .and_then(Value::as_str)
                    .filter(|url| url.starts_with(DOC_PROTOCOL_PREFIX));
                if let Some(id) = doc_id.and_then(parse_doc_id) {
                    ids.insert(id);
                }
            }
            for (_, child) in map {
                walk_blocks(child, ids);
            }
        }
        _ => {}
    }
}
