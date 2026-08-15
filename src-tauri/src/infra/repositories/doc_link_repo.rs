use crate::domain::doc_link::{DocLinkItem, GraphData, GraphEdge, GraphNode};
use crate::domain::error::DomainError;

pub async fn insert_self_link<'e, E>(executor: E, doc_id: &str, wid: i64) -> Result<(), DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query(
        "INSERT INTO sys_doc_link (source_doc_id, target_doc_id, wid, created_at, updated_at) VALUES (?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))",
    )
    .bind(doc_id)
    .bind(doc_id)
    .bind(wid)
    .execute(executor)
    .await
    .map_err(DomainError::infra)?;

    Ok(())
}

pub async fn upsert<'e, E>(
    executor: E,
    source_doc_id: &str,
    target_doc_id: &str,
    wid: i64,
) -> Result<(), DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query(
        "INSERT OR IGNORE INTO sys_doc_link (source_doc_id, target_doc_id, wid, created_at, updated_at) VALUES (?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))",
    )
    .bind(source_doc_id)
    .bind(target_doc_id)
    .bind(wid)
    .execute(executor)
    .await
    .map_err(DomainError::infra)?;

    Ok(())
}

pub async fn delete_link<'e, E>(
    executor: E,
    source_doc_id: &str,
    target_doc_id: &str,
) -> Result<(), DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query("DELETE FROM sys_doc_link WHERE source_doc_id = ? AND target_doc_id = ?")
        .bind(source_doc_id)
        .bind(target_doc_id)
        .execute(executor)
        .await
        .map_err(DomainError::infra)?;

    Ok(())
}

/// 删除新内容中已不存在的旧出链：source_doc_id 为当前文档、target_doc_id 不在
/// keep_target_ids 中的记录；保留自链接（创建文档时写入）。
pub async fn delete_unreferenced<'e, E>(
    executor: E,
    source_doc_id: &str,
    keep_target_ids: &[String],
) -> Result<(), DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let mut sql =
        String::from("DELETE FROM sys_doc_link WHERE source_doc_id = ? AND target_doc_id <> ?");
    if !keep_target_ids.is_empty() {
        let placeholders = vec!["?"; keep_target_ids.len()].join(", ");
        sql.push_str(&format!(" AND target_doc_id NOT IN ({})", placeholders));
    }

    let mut query = sqlx::query(&sql).bind(source_doc_id).bind(source_doc_id);
    for id in keep_target_ids {
        query = query.bind(id);
    }

    query.execute(executor).await.map_err(DomainError::infra)?;

    Ok(())
}

pub async fn delete_by_doc<'e, E>(executor: E, doc_id: &str) -> Result<(), DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query("DELETE FROM sys_doc_link WHERE source_doc_id = ? OR target_doc_id = ?")
        .bind(doc_id)
        .bind(doc_id)
        .execute(executor)
        .await
        .map_err(DomainError::infra)?;

    Ok(())
}

pub async fn delete_by_workspace<'e, E>(executor: E, wid: i64) -> Result<(), DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query("DELETE FROM sys_doc_link WHERE wid = ?")
        .bind(wid)
        .execute(executor)
        .await
        .map_err(DomainError::infra)?;

    Ok(())
}

pub async fn list_reverse_links<'e, E>(
    executor: E,
    doc_id: &str,
) -> Result<Vec<DocLinkItem>, DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let rows = sqlx::query_as::<_, DocLinkItem>(
        "SELECT d.id, COALESCE(d.title, '') AS title, COALESCE(d.emoji, '') AS emoji, d.is_delete \
         FROM sys_doc_link l \
         INNER JOIN sys_doc d ON d.id = l.source_doc_id \
         WHERE l.source_doc_id <> ? AND l.target_doc_id = ? \
         ORDER BY d.is_delete ASC, datetime(d.updated_at) DESC, d.id DESC",
    )
    .bind(doc_id)
    .bind(doc_id)
    .fetch_all(executor)
    .await
    .map_err(DomainError::infra)?;

    Ok(rows)
}

pub async fn list_graph_data(db: &sqlx::SqlitePool, wid: i64) -> Result<GraphData, DomainError> {
    let nodes = sqlx::query_as::<_, GraphNode>(
        "SELECT id, COALESCE(title, '') AS title, COALESCE(emoji, '') AS emoji, is_delete \
         FROM sys_doc \
         WHERE wid = ? \
         ORDER BY is_delete ASC, datetime(updated_at) DESC, id DESC",
    )
    .bind(wid)
    .fetch_all(db)
    .await
    .map_err(DomainError::infra)?;

    let edges = sqlx::query_as::<_, GraphEdge>(
        "SELECT source_doc_id AS source, target_doc_id AS target \
         FROM sys_doc_link \
         WHERE wid = ? AND source_doc_id != target_doc_id",
    )
    .bind(wid)
    .fetch_all(db)
    .await
    .map_err(DomainError::infra)?;

    Ok(GraphData { nodes, edges })
}
