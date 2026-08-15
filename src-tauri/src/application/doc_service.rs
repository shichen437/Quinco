use sqlx::SqlitePool;
use uuid::Uuid;

use crate::domain::doc::ensure_editable;
use crate::domain::doc::{DocDetail, DocListItem, TrashDocItem};
use crate::domain::error::DomainError;
use crate::infra::repositories::{doc_link_repo, doc_repo, file_repo, tag_repo, workspace_repo};

pub async fn list_current_workspace(db: &SqlitePool) -> Result<Vec<DocListItem>, DomainError> {
    let wid = workspace_repo::current_workspace_id(db).await?;
    doc_repo::list_by_workspace(db, wid).await
}

pub async fn list_favorite_current_workspace(
    db: &SqlitePool,
) -> Result<Vec<DocListItem>, DomainError> {
    let wid = workspace_repo::current_workspace_id(db).await?;
    doc_repo::list_favorite(db, wid).await
}

pub async fn quick_search(
    db: &SqlitePool,
    query: &str,
    limit: i64,
) -> Result<Vec<DocListItem>, DomainError> {
    let wid = workspace_repo::current_workspace_id(db).await?;
    let keyword = query.trim().to_string();
    let limit = limit.clamp(1, 20);

    if keyword.is_empty() {
        return doc_repo::recent_candidates(db, wid, limit, None).await;
    }

    doc_repo::search_candidates(db, wid, &keyword, limit, None).await
}

pub async fn list_by_tag_current_workspace(
    db: &SqlitePool,
    tag_id: i64,
) -> Result<Vec<DocListItem>, DomainError> {
    let wid = workspace_repo::current_workspace_id(db).await?;
    doc_repo::list_by_tag(db, wid, tag_id).await
}

pub async fn get(db: &SqlitePool, id: &str) -> Result<DocDetail, DomainError> {
    doc_repo::find_by_id(db, id)
        .await?
        .ok_or_else(|| DomainError::not_found("document"))
}

pub async fn create_current_workspace(db: &SqlitePool) -> Result<DocDetail, DomainError> {
    let wid = workspace_repo::current_workspace_id(db).await?;
    let id = Uuid::new_v4().to_string();

    let mut tx = db.begin().await.map_err(DomainError::infra)?;

    doc_repo::insert(&mut *tx, &id, wid).await?;
    doc_repo::insert_empty_ext(&mut *tx, &id).await?;
    doc_link_repo::insert_self_link(&mut *tx, &id, wid).await?;

    tx.commit().await.map_err(DomainError::infra)?;

    get(db, &id).await
}

pub async fn update_title(
    db: &SqlitePool,
    id: &str,
    title: &str,
) -> Result<DocDetail, DomainError> {
    let normalized = title.trim().to_string();

    let lock_flag = doc_repo::lock_flag(db, id).await?;
    ensure_editable(lock_flag, None)?;

    doc_repo::update_title(db, id, &normalized).await?;

    get(db, id).await
}

pub async fn update_emoji(
    db: &SqlitePool,
    id: &str,
    emoji: &str,
) -> Result<DocDetail, DomainError> {
    let normalized = emoji.trim().to_string();

    let lock_flag = doc_repo::lock_flag(db, id).await?;
    ensure_editable(lock_flag, None)?;

    doc_repo::update_emoji(db, id, &normalized).await?;

    get(db, id).await
}

pub async fn set_favorite(
    db: &SqlitePool,
    id: &str,
    is_favorite: i64,
) -> Result<DocDetail, DomainError> {
    let favorite = if is_favorite == 1 { 1 } else { 0 };

    if doc_repo::update_favorite(db, id, favorite).await? == 0 {
        return Err(DomainError::not_found("document"));
    }

    get(db, id).await
}

pub async fn set_lock(db: &SqlitePool, id: &str, is_lock: i64) -> Result<DocDetail, DomainError> {
    let lock = if is_lock == 1 { 1 } else { 0 };

    if doc_repo::update_lock(db, id, lock).await? == 0 {
        return Err(DomainError::not_found("document"));
    }

    get(db, id).await
}

pub async fn move_to_trash(db: &SqlitePool, id: &str) -> Result<(), DomainError> {
    if doc_repo::move_to_trash(db, id).await? == 0 {
        return Err(DomainError::not_found("document"));
    }

    Ok(())
}

pub async fn list_trash_current_workspace(
    db: &SqlitePool,
) -> Result<Vec<TrashDocItem>, DomainError> {
    let wid = workspace_repo::current_workspace_id(db).await?;
    doc_repo::list_trash(db, wid).await
}

pub async fn restore_from_trash(db: &SqlitePool, id: &str) -> Result<(), DomainError> {
    if doc_repo::restore_from_trash(db, id).await? == 0 {
        return Err(DomainError::not_found("document"));
    }

    Ok(())
}

pub async fn delete_permanently(db: &SqlitePool, id: &str) -> Result<(), DomainError> {
    let mut tx = db.begin().await.map_err(DomainError::infra)?;

    if !doc_repo::exists(&mut *tx, id).await? {
        return Err(DomainError::not_found("document"));
    }

    tag_repo::delete_links_by_doc(&mut *tx, id).await?;
    doc_link_repo::delete_by_doc(&mut *tx, id).await?;

    let file_ids = file_repo::delete_refs_by_doc(&mut tx, id).await?;
    for fid in &file_ids {
        file_repo::recalc_ref_count(&mut *tx, fid).await?;
    }

    doc_repo::delete_ext(&mut *tx, id).await?;
    doc_repo::delete_by_id(&mut *tx, id).await?;

    tx.commit().await.map_err(DomainError::infra)?;
    Ok(())
}
