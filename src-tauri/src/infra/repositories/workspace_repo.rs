use crate::domain::error::DomainError;
use crate::domain::workspace::Workspace;

pub async fn list<'e, E>(executor: E) -> Result<Vec<Workspace>, DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let rows = sqlx::query_as::<_, Workspace>(
        "SELECT id, name, is_current, type FROM sys_workspace ORDER BY id ASC",
    )
    .fetch_all(executor)
    .await
    .map_err(DomainError::infra)?;

    Ok(rows)
}

pub async fn find_current<'e, E>(executor: E) -> Result<Option<Workspace>, DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let row = sqlx::query_as::<_, Workspace>(
        "SELECT id, name, is_current, type FROM sys_workspace WHERE is_current = 1 ORDER BY id ASC LIMIT 1",
    )
    .fetch_optional(executor)
    .await
    .map_err(DomainError::infra)?;

    Ok(row)
}

pub async fn current_workspace_id<'e, E>(executor: E) -> Result<i64, DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let id = sqlx::query_scalar::<_, i64>(
        "SELECT id FROM sys_workspace WHERE is_current = 1 ORDER BY id ASC LIMIT 1",
    )
    .fetch_optional(executor)
    .await
    .map_err(DomainError::infra)?
    .ok_or_else(|| DomainError::validation("no current workspace"))?;

    Ok(id)
}

pub async fn find_by_id<'e, E>(executor: E, id: i64) -> Result<Option<Workspace>, DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let row = sqlx::query_as::<_, Workspace>(
        "SELECT id, name, is_current, type FROM sys_workspace WHERE id = ?",
    )
    .bind(id)
    .fetch_optional(executor)
    .await
    .map_err(DomainError::infra)?;

    Ok(row)
}

pub async fn insert_as_current(
    tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
    name: &str,
) -> Result<Workspace, DomainError> {
    sqlx::query("UPDATE sys_workspace SET is_current = 0")
        .execute(&mut **tx)
        .await
        .map_err(DomainError::infra)?;

    let insert_result = sqlx::query(
        "INSERT INTO sys_workspace (name, is_current, type, created_at, updated_at) VALUES (?, 1, 'local', datetime('now', 'localtime'), datetime('now', 'localtime'))",
    )
    .bind(name)
    .execute(&mut **tx)
    .await
    .map_err(DomainError::infra)?;

    let workspace = sqlx::query_as::<_, Workspace>(
        "SELECT id, name, is_current, type FROM sys_workspace WHERE id = ?",
    )
    .bind(insert_result.last_insert_rowid())
    .fetch_one(&mut **tx)
    .await
    .map_err(DomainError::infra)?;

    Ok(workspace)
}

pub async fn update_name<'e, E>(executor: E, id: i64, name: &str) -> Result<u64, DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let result = sqlx::query(
        "UPDATE sys_workspace SET name = ?, updated_at = datetime('now', 'localtime') WHERE id = ?",
    )
    .bind(name)
    .bind(id)
    .execute(executor)
    .await
    .map_err(DomainError::infra)?;

    Ok(result.rows_affected())
}

pub async fn current_flag<'e, E>(executor: E, id: i64) -> Result<Option<i64>, DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let flag = sqlx::query_scalar::<_, i64>("SELECT is_current FROM sys_workspace WHERE id = ?")
        .bind(id)
        .fetch_optional(executor)
        .await
        .map_err(DomainError::infra)?;

    Ok(flag)
}

pub async fn delete_by_id<'e, E>(executor: E, id: i64) -> Result<(), DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query("DELETE FROM sys_workspace WHERE id = ?")
        .bind(id)
        .execute(executor)
        .await
        .map_err(DomainError::infra)?;

    Ok(())
}

pub async fn first_workspace_id<'e, E>(executor: E) -> Result<Option<i64>, DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let id = sqlx::query_scalar::<_, i64>("SELECT id FROM sys_workspace ORDER BY id ASC LIMIT 1")
        .fetch_optional(executor)
        .await
        .map_err(DomainError::infra)?;

    Ok(id)
}

pub async fn switch_current<'e, E>(executor: E, id: i64) -> Result<(), DomainError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    sqlx::query("UPDATE sys_workspace SET is_current = CASE WHEN id = ? THEN 1 ELSE 0 END")
        .bind(id)
        .execute(executor)
        .await
        .map_err(DomainError::infra)?;

    Ok(())
}
