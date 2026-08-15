use std::collections::HashMap;
use std::collections::HashSet;

use crate::domain::error::DomainError;
use crate::domain::file::NewFile;

pub async fn find_id_by_hash<'e, E>(
    executor: E,
    content_hash: &str,
) -> Result<Option<String>, DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let id =
        sqlx::query_scalar::<_, String>("SELECT id FROM sys_file WHERE content_hash = ? LIMIT 1")
            .bind(content_hash)
            .fetch_optional(executor)
            .await
            .map_err(DomainError::infra)?;

    Ok(id)
}

pub async fn insert<'e, E>(executor: E, file: &NewFile<'_>) -> Result<(), DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query(
        "INSERT INTO sys_file (id, filename, file_size, file_ext, mime_type, storage_key, content_hash, ref_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, datetime('now', 'localtime'), datetime('now', 'localtime')) ON CONFLICT(content_hash) DO NOTHING",
    )
    .bind(file.id)
    .bind(file.filename)
    .bind(file.file_size)
    .bind(file.file_ext)
    .bind(file.mime_type)
    .bind(file.storage_key)
    .bind(file.content_hash)
    .execute(executor)
    .await
    .map_err(DomainError::infra)?;

    Ok(())
}

pub async fn find_storage<'e, E>(
    executor: E,
    id: &str,
) -> Result<Option<(String, String)>, DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let row = sqlx::query_as::<_, (String, String)>(
        "SELECT storage_key, mime_type FROM sys_file WHERE id = ? LIMIT 1",
    )
    .bind(id)
    .fetch_optional(executor)
    .await
    .map_err(DomainError::infra)?;

    Ok(row)
}

pub async fn recalc_ref_count<'e, E>(executor: E, fid: &str) -> Result<(), DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query(
        "UPDATE sys_file SET ref_count = (SELECT COALESCE(SUM(ref_count), 0) FROM sys_file_ref WHERE sys_file_ref.fid = ?), updated_at = datetime('now', 'localtime') WHERE id = ?",
    )
    .bind(fid)
    .bind(fid)
    .execute(executor)
    .await
    .map_err(DomainError::infra)?;

    Ok(())
}

pub async fn list_doc_refs<'e, E>(
    executor: E,
    doc_id: &str,
) -> Result<HashMap<String, i64>, DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let rows = sqlx::query_as::<_, (String, i64)>(
        "SELECT fid, ref_count FROM sys_file_ref WHERE doc_id = ?",
    )
    .bind(doc_id)
    .fetch_all(executor)
    .await
    .map_err(DomainError::infra)?;

    Ok(rows.into_iter().collect())
}

/// 全量同步文档的文件引用（fid -> 引用次数）：
/// 已有记录数量一致则不动，不一致（含归 0）则更新而不删除，
/// 新出现的记录插入，最后重算变更文件的 sys_file.ref_count。
pub async fn sync_doc_refs(
    tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
    doc_id: &str,
    refs: &HashMap<String, i64>,
) -> Result<(), DomainError> {
    let old_refs = list_doc_refs(&mut **tx, doc_id).await?;
    let mut changed: HashSet<&String> = HashSet::new();

    for (fid, ref_count) in refs {
        match old_refs.get(fid) {
            Some(old) if old == ref_count => {}
            Some(_) => {
                update_ref_count(&mut **tx, doc_id, fid, *ref_count).await?;
                changed.insert(fid);
            }
            None => {
                sqlx::query(
                    "INSERT INTO sys_file_ref (fid, doc_id, ref_count, created_at, updated_at) VALUES (?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))",
                )
                .bind(fid)
                .bind(doc_id)
                .bind(ref_count)
                .execute(&mut **tx)
                .await
                .map_err(DomainError::infra)?;
                changed.insert(fid);
            }
        }
    }

    // 旧引用不在新内容中：数量归 0，保留记录。
    for fid in old_refs.keys() {
        if !refs.contains_key(fid) {
            update_ref_count(&mut **tx, doc_id, fid, 0).await?;
            changed.insert(fid);
        }
    }

    for fid in &changed {
        recalc_ref_count(&mut **tx, fid).await?;
    }

    Ok(())
}

async fn update_ref_count<'e, E>(
    executor: E,
    doc_id: &str,
    fid: &str,
    ref_count: i64,
) -> Result<(), DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query(
        "UPDATE sys_file_ref SET ref_count = ?, updated_at = datetime('now', 'localtime') WHERE doc_id = ? AND fid = ?",
    )
    .bind(ref_count)
    .bind(doc_id)
    .bind(fid)
    .execute(executor)
    .await
    .map_err(DomainError::infra)?;

    Ok(())
}

pub async fn delete_refs_by_doc(
    tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
    doc_id: &str,
) -> Result<Vec<String>, DomainError> {
    let fids: Vec<String> = list_doc_refs(&mut **tx, doc_id)
        .await?
        .into_keys()
        .collect();

    if !fids.is_empty() {
        sqlx::query("DELETE FROM sys_file_ref WHERE doc_id = ?")
            .bind(doc_id)
            .execute(&mut **tx)
            .await
            .map_err(DomainError::infra)?;
    }

    Ok(fids)
}

pub async fn delete_refs_by_workspace(
    tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
    wid: i64,
) -> Result<Vec<String>, DomainError> {
    let fids = sqlx::query_scalar::<_, String>(
        "SELECT DISTINCT fid FROM sys_file_ref WHERE doc_id IN (SELECT id FROM sys_doc WHERE wid = ?)",
    )
    .bind(wid)
    .fetch_all(&mut **tx)
    .await
    .map_err(DomainError::infra)?;

    if !fids.is_empty() {
        sqlx::query(
            "DELETE FROM sys_file_ref WHERE doc_id IN (SELECT id FROM sys_doc WHERE wid = ?)",
        )
        .bind(wid)
        .execute(&mut **tx)
        .await
        .map_err(DomainError::infra)?;
    }

    Ok(fids)
}
