use crate::domain::error::DomainError;
use crate::domain::tag::TagItem;

pub async fn list_by_workspace<'e, E>(executor: E, wid: i64) -> Result<Vec<TagItem>, DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let rows = sqlx::query_as::<_, TagItem>(
        "SELECT id, name FROM sys_tag WHERE wid = ? ORDER BY name COLLATE NOCASE ASC, id ASC",
    )
    .bind(wid)
    .fetch_all(executor)
    .await
    .map_err(DomainError::infra)?;

    Ok(rows)
}

pub async fn list_by_doc<'e, E>(executor: E, doc_id: &str) -> Result<Vec<TagItem>, DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let rows = sqlx::query_as::<_, TagItem>(
        "SELECT t.id, t.name FROM sys_tag t INNER JOIN sys_tag_link l ON l.tid = t.id WHERE l.doc_id = ? ORDER BY t.name COLLATE NOCASE ASC, t.id ASC",
    )
    .bind(doc_id)
    .fetch_all(executor)
    .await
    .map_err(DomainError::infra)?;

    Ok(rows)
}

pub async fn insert_idempotent(
    tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
    name: &str,
    wid: i64,
) -> Result<TagItem, DomainError> {
    sqlx::query(
        "INSERT OR IGNORE INTO sys_tag (name, wid, created_at, updated_at) VALUES (?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))",
    )
    .bind(name)
    .bind(wid)
    .execute(&mut **tx)
    .await
    .map_err(DomainError::infra)?;

    let tag = sqlx::query_as::<_, TagItem>(
        "SELECT id, name FROM sys_tag WHERE wid = ? AND name = ? LIMIT 1",
    )
    .bind(wid)
    .bind(name)
    .fetch_one(&mut **tx)
    .await
    .map_err(DomainError::infra)?;

    Ok(tag)
}

/// 更新标签名，返回受影响行数。
pub async fn update_name<'e, E>(
    executor: E,
    id: i64,
    name: &str,
    wid: i64,
) -> Result<u64, DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let result = sqlx::query(
        "UPDATE sys_tag SET name = ?, updated_at = datetime('now', 'localtime') WHERE id = ? AND wid = ?",
    )
    .bind(name)
    .bind(id)
    .bind(wid)
    .execute(executor)
    .await
    .map_err(DomainError::infra)?;

    Ok(result.rows_affected())
}

pub async fn find_in_workspace<'e, E>(
    executor: E,
    id: i64,
    wid: i64,
) -> Result<Option<TagItem>, DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let row = sqlx::query_as::<_, TagItem>(
        "SELECT id, name FROM sys_tag WHERE id = ? AND wid = ? LIMIT 1",
    )
    .bind(id)
    .bind(wid)
    .fetch_optional(executor)
    .await
    .map_err(DomainError::infra)?;

    Ok(row)
}

pub async fn exists_in_workspace<'e, E>(executor: E, id: i64, wid: i64) -> Result<bool, DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let row = sqlx::query_scalar::<_, i64>("SELECT id FROM sys_tag WHERE id = ? AND wid = ?")
        .bind(id)
        .bind(wid)
        .fetch_optional(executor)
        .await
        .map_err(DomainError::infra)?;

    Ok(row.is_some())
}

pub async fn delete_in_workspace<'e, E>(executor: E, id: i64, wid: i64) -> Result<(), DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query("DELETE FROM sys_tag WHERE id = ? AND wid = ?")
        .bind(id)
        .bind(wid)
        .execute(executor)
        .await
        .map_err(DomainError::infra)?;

    Ok(())
}

pub async fn delete_by_workspace<'e, E>(executor: E, wid: i64) -> Result<(), DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query("DELETE FROM sys_tag WHERE wid = ?")
        .bind(wid)
        .execute(executor)
        .await
        .map_err(DomainError::infra)?;

    Ok(())
}

// ---- sys_tag_link 表操作 ----

pub async fn attach<'e, E>(executor: E, tag_id: i64, doc_id: &str) -> Result<(), DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query(
        "INSERT OR IGNORE INTO sys_tag_link (tid, doc_id, created_at, updated_at) VALUES (?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))",
    )
    .bind(tag_id)
    .bind(doc_id)
    .execute(executor)
    .await
    .map_err(DomainError::infra)?;

    Ok(())
}

pub async fn detach<'e, E>(executor: E, tag_id: i64, doc_id: &str) -> Result<(), DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query("DELETE FROM sys_tag_link WHERE tid = ? AND doc_id = ?")
        .bind(tag_id)
        .bind(doc_id)
        .execute(executor)
        .await
        .map_err(DomainError::infra)?;

    Ok(())
}

pub async fn delete_links_by_tag<'e, E>(executor: E, tag_id: i64) -> Result<(), DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query("DELETE FROM sys_tag_link WHERE tid = ?")
        .bind(tag_id)
        .execute(executor)
        .await
        .map_err(DomainError::infra)?;

    Ok(())
}

pub async fn delete_links_by_doc<'e, E>(executor: E, doc_id: &str) -> Result<(), DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query("DELETE FROM sys_tag_link WHERE doc_id = ?")
        .bind(doc_id)
        .execute(executor)
        .await
        .map_err(DomainError::infra)?;

    Ok(())
}

pub async fn delete_links_by_workspace<'e, E>(executor: E, wid: i64) -> Result<(), DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query("DELETE FROM sys_tag_link WHERE tid IN (SELECT id FROM sys_tag WHERE wid = ?)")
        .bind(wid)
        .execute(executor)
        .await
        .map_err(DomainError::infra)?;

    Ok(())
}
