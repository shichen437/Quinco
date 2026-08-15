use sqlx::SqlitePool;

use crate::application::{doc_link_service, file_service};
use crate::domain::doc::ensure_editable;
use crate::domain::doc::DocWithContent;
use crate::domain::error::DomainError;
use crate::infra::repositories::{doc_link_repo, doc_repo, file_repo};

pub async fn get_with_content(db: &SqlitePool, id: &str) -> Result<DocWithContent, DomainError> {
    doc_repo::find_with_content(db, id)
        .await?
        .ok_or_else(|| DomainError::not_found("document"))
}

pub async fn update_content(
    db: &SqlitePool,
    id: &str,
    content: &str,
    plain_text: &str,
) -> Result<(), DomainError> {
    let file_refs = file_service::extract_image_file_refs(content);
    let doc_refs = doc_link_service::extract_doc_refs(content);

    let mut tx = db.begin().await.map_err(DomainError::infra)?;

    let lock_flag = doc_repo::lock_flag(&mut *tx, id).await?;
    ensure_editable(lock_flag, None)?;

    let wid = doc_repo::wid_of(&mut *tx, id)
        .await?
        .ok_or_else(|| DomainError::not_found("document"))?;

    doc_repo::upsert_content(&mut *tx, id, content, plain_text).await?;
    doc_repo::touch_updated_at(&mut *tx, id).await?;
    file_repo::sync_doc_refs(&mut tx, id, &file_refs).await?;

    // 同步文档引用：新增内容中的引用（已存在则忽略），并删除内容中已不存在的旧链接。
    for target_id in &doc_refs {
        if doc_repo::wid_of(&mut *tx, target_id).await?.is_some() {
            doc_link_repo::upsert(&mut *tx, id, target_id, wid).await?;
        }
    }
    doc_link_repo::delete_unreferenced(&mut *tx, id, &doc_refs).await?;

    tx.commit().await.map_err(DomainError::infra)?;
    Ok(())
}
