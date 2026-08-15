use sqlx::SqlitePool;

use crate::domain::error::DomainError;
use crate::domain::workspace::{normalize_workspace_name, Workspace};
use crate::infra::repositories::{doc_link_repo, doc_repo, file_repo, tag_repo, workspace_repo};

pub async fn list(db: &SqlitePool) -> Result<Vec<Workspace>, DomainError> {
    workspace_repo::list(db).await
}

pub async fn current(db: &SqlitePool) -> Result<Option<Workspace>, DomainError> {
    workspace_repo::find_current(db).await
}

pub async fn get(db: &SqlitePool, id: i64) -> Result<Workspace, DomainError> {
    workspace_repo::find_by_id(db, id)
        .await?
        .ok_or_else(|| DomainError::not_found("workspace"))
}

pub async fn create(db: &SqlitePool, name: &str) -> Result<Workspace, DomainError> {
    let name = normalize_workspace_name(name)?;

    let mut tx = db.begin().await.map_err(DomainError::infra)?;
    let workspace = workspace_repo::insert_as_current(&mut tx, &name).await?;
    tx.commit().await.map_err(DomainError::infra)?;

    Ok(workspace)
}

pub async fn update(db: &SqlitePool, id: i64, name: &str) -> Result<Workspace, DomainError> {
    let name = normalize_workspace_name(name)?;

    if workspace_repo::update_name(db, id, &name).await? == 0 {
        return Err(DomainError::not_found("workspace"));
    }

    get(db, id).await
}

pub async fn delete(db: &SqlitePool, id: i64) -> Result<(), DomainError> {
    if id == 1 {
        return Err(DomainError::illegal_operation(
            "default workspace cannot be deleted",
        ));
    }

    let mut tx = db.begin().await.map_err(DomainError::infra)?;

    let is_current = workspace_repo::current_flag(&mut *tx, id)
        .await?
        .ok_or_else(|| DomainError::not_found("workspace"))?;

    // 级联清理该空间下的所有数据：标签（及链接）、双链、文档（含内容与文件引用）
    tag_repo::delete_links_by_workspace(&mut *tx, id).await?;
    tag_repo::delete_by_workspace(&mut *tx, id).await?;
    doc_link_repo::delete_by_workspace(&mut *tx, id).await?;

    let file_ids = file_repo::delete_refs_by_workspace(&mut tx, id).await?;
    for fid in &file_ids {
        file_repo::recalc_ref_count(&mut *tx, fid).await?;
    }

    doc_repo::delete_ext_by_workspace(&mut *tx, id).await?;
    doc_repo::delete_by_workspace(&mut *tx, id).await?;

    workspace_repo::delete_by_id(&mut *tx, id).await?;

    if is_current == 1 {
        if let Some(next_id) = workspace_repo::first_workspace_id(&mut *tx).await? {
            workspace_repo::switch_current(&mut *tx, next_id).await?;
        }
    }

    tx.commit().await.map_err(DomainError::infra)?;
    Ok(())
}

pub async fn switch(db: &SqlitePool, id: i64) -> Result<Workspace, DomainError> {
    let mut tx = db.begin().await.map_err(DomainError::infra)?;

    if workspace_repo::find_by_id(&mut *tx, id).await?.is_none() {
        return Err(DomainError::not_found("workspace"));
    }

    workspace_repo::switch_current(&mut *tx, id).await?;

    let workspace = workspace_repo::find_by_id(&mut *tx, id)
        .await?
        .ok_or_else(|| DomainError::not_found("workspace"))?;

    tx.commit().await.map_err(DomainError::infra)?;

    Ok(workspace)
}
