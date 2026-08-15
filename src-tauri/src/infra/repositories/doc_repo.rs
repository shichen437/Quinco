use crate::domain::doc::{DocDetail, DocListItem, DocWithContent, TrashDocItem};
use crate::domain::error::DomainError;

pub async fn list_by_workspace<'e, E>(
    executor: E,
    wid: i64,
) -> Result<Vec<DocListItem>, DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let rows = sqlx::query_as::<_, DocListItem>(
        "SELECT id, COALESCE(title, '') AS title, COALESCE(emoji, '') AS emoji, updated_at FROM sys_doc WHERE wid = ? AND is_delete = 0 ORDER BY datetime(updated_at) DESC, id DESC",
    )
    .bind(wid)
    .fetch_all(executor)
    .await
    .map_err(DomainError::infra)?;

    Ok(rows)
}

pub async fn list_favorite<'e, E>(executor: E, wid: i64) -> Result<Vec<DocListItem>, DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let rows = sqlx::query_as::<_, DocListItem>(
        "SELECT id, COALESCE(title, '') AS title, COALESCE(emoji, '') AS emoji, updated_at FROM sys_doc WHERE wid = ? AND is_delete = 0 AND is_favorite = 1 ORDER BY datetime(updated_at) DESC, id DESC",
    )
    .bind(wid)
    .fetch_all(executor)
    .await
    .map_err(DomainError::infra)?;

    Ok(rows)
}

pub async fn list_by_tag<'e, E>(
    executor: E,
    wid: i64,
    tag_id: i64,
) -> Result<Vec<DocListItem>, DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let rows = sqlx::query_as::<_, DocListItem>(
        "SELECT d.id, COALESCE(d.title, '') AS title, COALESCE(d.emoji, '') AS emoji, d.updated_at FROM sys_doc d INNER JOIN sys_tag_link l ON l.doc_id = d.id WHERE d.wid = ? AND d.is_delete = 0 AND l.tid = ? ORDER BY datetime(d.updated_at) DESC, d.id DESC",
    )
    .bind(wid)
    .bind(tag_id)
    .fetch_all(executor)
    .await
    .map_err(DomainError::infra)?;

    Ok(rows)
}

pub async fn list_trash<'e, E>(executor: E, wid: i64) -> Result<Vec<TrashDocItem>, DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let rows = sqlx::query_as::<_, TrashDocItem>(
        "SELECT id, COALESCE(title, '') AS title, COALESCE(emoji, '') AS emoji, deleted_at FROM sys_doc WHERE wid = ? AND is_delete = 1 ORDER BY datetime(deleted_at) DESC, id DESC",
    )
    .bind(wid)
    .fetch_all(executor)
    .await
    .map_err(DomainError::infra)?;

    Ok(rows)
}

pub async fn find_by_id<'e, E>(executor: E, id: &str) -> Result<Option<DocDetail>, DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let row = sqlx::query_as::<_, DocDetail>(
        "SELECT id, COALESCE(title, '') AS title, COALESCE(emoji, '') AS emoji, wid, is_lock, is_favorite, is_delete, deleted_at, created_at, updated_at FROM sys_doc WHERE id = ? LIMIT 1",
    )
    .bind(id)
    .fetch_optional(executor)
    .await
    .map_err(DomainError::infra)?;

    Ok(row)
}

pub async fn find_with_content<'e, E>(
    executor: E,
    id: &str,
) -> Result<Option<DocWithContent>, DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let row = sqlx::query_as::<_, DocWithContent>(
        "SELECT d.id, COALESCE(d.title, '') AS title, COALESCE(d.emoji, '') AS emoji, d.wid, d.is_lock, d.is_favorite, d.is_delete, d.deleted_at, d.created_at, d.updated_at, COALESCE(e.content, '') AS content FROM sys_doc d LEFT JOIN sys_doc_ext e ON e.doc_id = d.id WHERE d.id = ? LIMIT 1",
    )
    .bind(id)
    .fetch_optional(executor)
    .await
    .map_err(DomainError::infra)?;

    Ok(row)
}

pub async fn exists<'e, E>(executor: E, id: &str) -> Result<bool, DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let row = sqlx::query_scalar::<_, String>("SELECT id FROM sys_doc WHERE id = ?")
        .bind(id)
        .fetch_optional(executor)
        .await
        .map_err(DomainError::infra)?;

    Ok(row.is_some())
}

pub async fn lock_flag<'e, E>(executor: E, id: &str) -> Result<Option<i64>, DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let flag = sqlx::query_scalar::<_, i64>("SELECT is_lock FROM sys_doc WHERE id = ?")
        .bind(id)
        .fetch_optional(executor)
        .await
        .map_err(DomainError::infra)?;

    Ok(flag)
}

pub async fn wid_and_lock<'e, E>(executor: E, id: &str) -> Result<Option<(i64, i64)>, DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let row = sqlx::query_as::<_, (i64, i64)>("SELECT wid, is_lock FROM sys_doc WHERE id = ?")
        .bind(id)
        .fetch_optional(executor)
        .await
        .map_err(DomainError::infra)?;

    Ok(row)
}

pub async fn wid_of<'e, E>(executor: E, id: &str) -> Result<Option<i64>, DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let wid = sqlx::query_scalar::<_, i64>("SELECT wid FROM sys_doc WHERE id = ?")
        .bind(id)
        .fetch_optional(executor)
        .await
        .map_err(DomainError::infra)?;

    Ok(wid)
}

pub async fn insert<'e, E>(executor: E, id: &str, wid: i64) -> Result<(), DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query(
        "INSERT INTO sys_doc (id, title, wid, is_lock, is_favorite, is_delete, created_at, updated_at) VALUES (?, '', ?, 0, 0, 0, datetime('now', 'localtime'), datetime('now', 'localtime'))",
    )
    .bind(id)
    .bind(wid)
    .execute(executor)
    .await
    .map_err(DomainError::infra)?;

    Ok(())
}

pub async fn update_title<'e, E>(executor: E, id: &str, title: &str) -> Result<(), DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query(
        "UPDATE sys_doc SET title = ?, updated_at = datetime('now', 'localtime') WHERE id = ?",
    )
    .bind(title)
    .bind(id)
    .execute(executor)
    .await
    .map_err(DomainError::infra)?;

    Ok(())
}

pub async fn update_emoji<'e, E>(executor: E, id: &str, emoji: &str) -> Result<(), DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query(
        "UPDATE sys_doc SET emoji = ?, updated_at = datetime('now', 'localtime') WHERE id = ?",
    )
    .bind(emoji)
    .bind(id)
    .execute(executor)
    .await
    .map_err(DomainError::infra)?;

    Ok(())
}

pub async fn update_favorite<'e, E>(
    executor: E,
    id: &str,
    is_favorite: i64,
) -> Result<u64, DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let result = sqlx::query(
        "UPDATE sys_doc SET is_favorite = ?, updated_at = datetime('now', 'localtime') WHERE id = ?",
    )
    .bind(is_favorite)
    .bind(id)
    .execute(executor)
    .await
    .map_err(DomainError::infra)?;

    Ok(result.rows_affected())
}

pub async fn update_lock<'e, E>(executor: E, id: &str, is_lock: i64) -> Result<u64, DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let result = sqlx::query(
        "UPDATE sys_doc SET is_lock = ?, updated_at = datetime('now', 'localtime') WHERE id = ?",
    )
    .bind(is_lock)
    .bind(id)
    .execute(executor)
    .await
    .map_err(DomainError::infra)?;

    Ok(result.rows_affected())
}

pub async fn move_to_trash<'e, E>(executor: E, id: &str) -> Result<u64, DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let result = sqlx::query(
        "UPDATE sys_doc SET is_delete = 1, deleted_at = datetime('now', 'localtime'), updated_at = datetime('now', 'localtime') WHERE id = ?",
    )
    .bind(id)
    .execute(executor)
    .await
    .map_err(DomainError::infra)?;

    Ok(result.rows_affected())
}

pub async fn restore_from_trash<'e, E>(executor: E, id: &str) -> Result<u64, DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let result = sqlx::query(
        "UPDATE sys_doc SET is_delete = 0, deleted_at = NULL, updated_at = datetime('now', 'localtime') WHERE id = ?",
    )
    .bind(id)
    .execute(executor)
    .await
    .map_err(DomainError::infra)?;

    Ok(result.rows_affected())
}

pub async fn delete_by_id<'e, E>(executor: E, id: &str) -> Result<(), DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query("DELETE FROM sys_doc WHERE id = ?")
        .bind(id)
        .execute(executor)
        .await
        .map_err(DomainError::infra)?;

    Ok(())
}

pub async fn delete_by_workspace<'e, E>(executor: E, wid: i64) -> Result<(), DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query("DELETE FROM sys_doc WHERE wid = ?")
        .bind(wid)
        .execute(executor)
        .await
        .map_err(DomainError::infra)?;

    Ok(())
}

pub async fn touch_updated_at<'e, E>(executor: E, id: &str) -> Result<(), DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query("UPDATE sys_doc SET updated_at = datetime('now', 'localtime') WHERE id = ?")
        .bind(id)
        .execute(executor)
        .await
        .map_err(DomainError::infra)?;

    Ok(())
}

pub async fn insert_empty_ext<'e, E>(executor: E, doc_id: &str) -> Result<(), DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query(
        "INSERT INTO sys_doc_ext (doc_id, content, plain_text, created_at, updated_at) VALUES (?, '', '', datetime('now', 'localtime'), datetime('now', 'localtime'))",
    )
    .bind(doc_id)
    .execute(executor)
    .await
    .map_err(DomainError::infra)?;

    Ok(())
}

pub async fn upsert_content<'e, E>(
    executor: E,
    doc_id: &str,
    content: &str,
    plain_text: &str,
) -> Result<(), DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query(
        "INSERT INTO sys_doc_ext (doc_id, content, plain_text, created_at, updated_at) VALUES (?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime')) ON CONFLICT(doc_id) DO UPDATE SET content = excluded.content, plain_text = excluded.plain_text, updated_at = datetime('now', 'localtime')",
    )
    .bind(doc_id)
    .bind(content)
    .bind(plain_text)
    .execute(executor)
    .await
    .map_err(DomainError::infra)?;

    Ok(())
}

pub async fn delete_ext<'e, E>(executor: E, doc_id: &str) -> Result<(), DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query("DELETE FROM sys_doc_ext WHERE doc_id = ?")
        .bind(doc_id)
        .execute(executor)
        .await
        .map_err(DomainError::infra)?;

    Ok(())
}

pub async fn delete_ext_by_workspace<'e, E>(executor: E, wid: i64) -> Result<(), DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query("DELETE FROM sys_doc_ext WHERE doc_id IN (SELECT id FROM sys_doc WHERE wid = ?)")
        .bind(wid)
        .execute(executor)
        .await
        .map_err(DomainError::infra)?;

    Ok(())
}

// ---- 引用候选搜索 ----

/// 关键词为空时：按最近更新时间返回，exclude_id 非空时排除该文档（通常为当前编辑文档）。
pub async fn recent_candidates<'e, E>(
    executor: E,
    wid: i64,
    limit: i64,
    exclude_id: Option<&str>,
) -> Result<Vec<DocListItem>, DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let rows = sqlx::query_as::<_, DocListItem>(
        "SELECT id, COALESCE(title, '') AS title, COALESCE(emoji, '') AS emoji, updated_at \
         FROM sys_doc \
         WHERE wid = ? AND is_delete = 0 AND (? IS NULL OR id != ?) \
         ORDER BY datetime(updated_at) DESC, id DESC \
         LIMIT ?",
    )
    .bind(wid)
    .bind(exclude_id)
    .bind(exclude_id)
    .bind(limit)
    .fetch_all(executor)
    .await
    .map_err(DomainError::infra)?;

    Ok(rows)
}

/// 关键词非空时：精确匹配优先，其次前缀匹配，最后包含匹配；exclude_id 非空时排除该文档。
pub async fn search_candidates<'e, E>(
    executor: E,
    wid: i64,
    keyword: &str,
    limit: i64,
    exclude_id: Option<&str>,
) -> Result<Vec<DocListItem>, DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let like = format!("%{}%", keyword);
    let starts_with = format!("{}%", keyword);

    let rows = sqlx::query_as::<_, DocListItem>(
        "SELECT id, COALESCE(title, '') AS title, COALESCE(emoji, '') AS emoji, updated_at \
         FROM sys_doc \
         WHERE wid = ? AND is_delete = 0 AND (? IS NULL OR id != ?) \
         AND COALESCE(title, '') LIKE ? \
         ORDER BY CASE \
             WHEN COALESCE(title, '') = ? THEN 0 \
             WHEN COALESCE(title, '') LIKE ? THEN 1 \
             ELSE 2 \
         END, datetime(updated_at) DESC, id DESC \
         LIMIT ?",
    )
    .bind(wid)
    .bind(exclude_id)
    .bind(exclude_id)
    .bind(like)
    .bind(keyword)
    .bind(starts_with)
    .bind(limit)
    .fetch_all(executor)
    .await
    .map_err(DomainError::infra)?;

    Ok(rows)
}
