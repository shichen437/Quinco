use sqlx::SqlitePool;

use crate::domain::doc::ensure_editable;
use crate::domain::error::DomainError;
use crate::domain::tag::{normalize_tag_name, TagItem};
use crate::infra::repositories::{doc_repo, tag_repo, workspace_repo};

pub async fn list_current_workspace(db: &SqlitePool) -> Result<Vec<TagItem>, DomainError> {
    let wid = workspace_repo::current_workspace_id(db).await?;
    tag_repo::list_by_workspace(db, wid).await
}

pub async fn create_current_workspace(db: &SqlitePool, name: &str) -> Result<TagItem, DomainError> {
    let wid = workspace_repo::current_workspace_id(db).await?;
    let trimmed = normalize_tag_name(name)?;

    let mut tx = db.begin().await.map_err(DomainError::infra)?;
    let tag = tag_repo::insert_idempotent(&mut tx, &trimmed, wid).await?;
    tx.commit().await.map_err(DomainError::infra)?;

    Ok(tag)
}

pub async fn update_current_workspace(
    db: &SqlitePool,
    id: i64,
    name: &str,
) -> Result<TagItem, DomainError> {
    let wid = workspace_repo::current_workspace_id(db).await?;
    let trimmed = normalize_tag_name(name)?;

    if tag_repo::update_name(db, id, &trimmed, wid).await? == 0 {
        return Err(DomainError::not_found("tag"));
    }

    tag_repo::find_in_workspace(db, id, wid)
        .await?
        .ok_or_else(|| DomainError::not_found("tag"))
}

pub async fn delete_current_workspace(db: &SqlitePool, id: i64) -> Result<(), DomainError> {
    let wid = workspace_repo::current_workspace_id(db).await?;
    let mut tx = db.begin().await.map_err(DomainError::infra)?;

    if !tag_repo::exists_in_workspace(&mut *tx, id, wid).await? {
        return Err(DomainError::not_found("tag"));
    }

    tag_repo::delete_links_by_tag(&mut *tx, id).await?;
    tag_repo::delete_in_workspace(&mut *tx, id, wid).await?;

    tx.commit().await.map_err(DomainError::infra)?;
    Ok(())
}

pub async fn list_doc_tags(db: &SqlitePool, doc_id: &str) -> Result<Vec<TagItem>, DomainError> {
    tag_repo::list_by_doc(db, doc_id).await
}

pub async fn attach_tag(db: &SqlitePool, doc_id: &str, tag_id: i64) -> Result<(), DomainError> {
    let mut tx = db.begin().await.map_err(DomainError::infra)?;

    let (wid, is_lock) = doc_repo::wid_and_lock(&mut *tx, doc_id)
        .await?
        .ok_or_else(|| DomainError::not_found("document"))?;

    if is_lock == 1 {
        return Err(DomainError::locked());
    }

    if !tag_repo::exists_in_workspace(&mut *tx, tag_id, wid).await? {
        return Err(DomainError::not_found("tag"));
    }

    tag_repo::attach(&mut *tx, tag_id, doc_id).await?;
    doc_repo::touch_updated_at(&mut *tx, doc_id).await?;

    tx.commit().await.map_err(DomainError::infra)?;
    Ok(())
}

pub async fn detach_tag(db: &SqlitePool, doc_id: &str, tag_id: i64) -> Result<(), DomainError> {
    let mut tx = db.begin().await.map_err(DomainError::infra)?;

    let lock_flag = doc_repo::lock_flag(&mut *tx, doc_id).await?;
    ensure_editable(lock_flag, None)?;

    tag_repo::detach(&mut *tx, tag_id, doc_id).await?;
    doc_repo::touch_updated_at(&mut *tx, doc_id).await?;

    tx.commit().await.map_err(DomainError::infra)?;
    Ok(())
}
