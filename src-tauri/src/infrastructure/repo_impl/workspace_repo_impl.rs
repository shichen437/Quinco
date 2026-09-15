use async_trait::async_trait;
use chrono::NaiveDateTime;
use sqlx::SqlitePool;

use crate::domain::workspace::entity::{NewWorkspace, Workspace, WorkspaceType};
use crate::domain::workspace::repo::WorkspaceRepository;
use crate::shared::error::DomainError;

#[derive(sqlx::FromRow)]
struct WorkspaceRow {
    id: i64,
    name: String,
    is_current: i64,
    r#type: String,
    created_at: Option<NaiveDateTime>,
    updated_at: Option<NaiveDateTime>,
}

impl From<WorkspaceRow> for Workspace {
    fn from(r: WorkspaceRow) -> Self {
        Workspace::from_parts(
            r.id,
            r.name,
            r.is_current != 0,
            WorkspaceType::parse_or_default(&r.r#type),
            r.created_at,
            r.updated_at,
        )
    }
}

const WS_COLUMNS: &str = "id, name, is_current, type, created_at, updated_at";

pub struct WorkspaceRepoImpl {
    pool: SqlitePool,
}

impl WorkspaceRepoImpl {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl WorkspaceRepository for WorkspaceRepoImpl {
    async fn get_all(&self) -> Result<Vec<Workspace>, DomainError> {
        sqlx::query_as::<_, WorkspaceRow>(&format!(
            "SELECT {WS_COLUMNS} FROM sys_workspace ORDER BY is_current DESC, created_at ASC"
        ))
        .fetch_all(&self.pool)
        .await
        .map_err(DomainError::infra)
        .map(|rows| rows.into_iter().map(Workspace::from).collect())
    }

    async fn get_current(&self) -> Result<Workspace, DomainError> {
        sqlx::query_as::<_, WorkspaceRow>(&format!(
            "SELECT {WS_COLUMNS} FROM sys_workspace WHERE is_current = 1 LIMIT 1"
        ))
        .fetch_optional(&self.pool)
        .await
        .map_err(DomainError::infra)?
        .map(Workspace::from)
        .ok_or_else(|| DomainError::not_found("Current workspace"))
    }

    async fn get_by_id(&self, id: i64) -> Result<Workspace, DomainError> {
        sqlx::query_as::<_, WorkspaceRow>(&format!(
            "SELECT {WS_COLUMNS} FROM sys_workspace WHERE id = ?"
        ))
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(DomainError::infra)?
        .map(Workspace::from)
        .ok_or_else(|| DomainError::not_found(format!("Workspace #{}", id)))
    }

    async fn create(&self, workspace: NewWorkspace) -> Result<Workspace, DomainError> {
        let result = sqlx::query_as::<_, WorkspaceRow>(&format!(
            "INSERT INTO sys_workspace (name, type) VALUES (?, ?) RETURNING {WS_COLUMNS}"
        ))
        .bind(workspace.name())
        .bind(workspace.r#type().as_str())
        .fetch_one(&self.pool)
        .await
        .map_err(DomainError::infra)
        .map(Workspace::from)?;

        Ok(result)
    }

    async fn switch_to(&self, id: i64) -> Result<Workspace, DomainError> {
        let mut tx = self.pool.begin().await.map_err(DomainError::infra)?;

        sqlx::query("UPDATE sys_workspace SET is_current = 0 WHERE is_current = 1")
            .execute(&mut *tx)
            .await
            .map_err(DomainError::infra)?;

        sqlx::query("UPDATE sys_workspace SET is_current = 1, updated_at = datetime('now', 'localtime') WHERE id = ?")
            .bind(id)
            .execute(&mut *tx)
            .await
            .map_err(DomainError::infra)?;

        let ws = sqlx::query_as::<_, WorkspaceRow>(&format!(
            "SELECT {WS_COLUMNS} FROM sys_workspace WHERE id = ?"
        ))
        .bind(id)
        .fetch_one(&mut *tx)
        .await
        .map_err(DomainError::infra)
        .map(Workspace::from)?;

        tx.commit().await.map_err(DomainError::infra)?;

        Ok(ws)
    }

    async fn delete(&self, id: i64) -> Result<(), DomainError> {
        sqlx::query("DELETE FROM sys_workspace WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(DomainError::infra)?;
        Ok(())
    }

    async fn exists(&self) -> Result<bool, DomainError> {
        let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM sys_workspace")
            .fetch_one(&self.pool)
            .await
            .map_err(DomainError::infra)?;
        Ok(count > 0)
    }

    async fn find_first_demo(&self) -> Result<Option<Workspace>, DomainError> {
        sqlx::query_as::<_, WorkspaceRow>(&format!(
            "SELECT {WS_COLUMNS} FROM sys_workspace WHERE type = 'demo' ORDER BY id ASC LIMIT 1"
        ))
        .fetch_optional(&self.pool)
        .await
        .map_err(DomainError::infra)
        .map(|row| row.map(Workspace::from))
    }

    async fn update_name(&self, id: i64, name: &str) -> Result<Workspace, DomainError> {
        sqlx::query(
            "UPDATE sys_workspace SET name = ?, updated_at = datetime('now', 'localtime') WHERE id = ?",
        )
        .bind(name)
        .bind(id)
        .execute(&self.pool)
        .await
        .map_err(DomainError::infra)?;

        sqlx::query_as::<_, WorkspaceRow>(&format!(
            "SELECT {WS_COLUMNS} FROM sys_workspace WHERE id = ?"
        ))
        .bind(id)
        .fetch_one(&self.pool)
        .await
        .map_err(DomainError::infra)
        .map(Workspace::from)
    }

    async fn reset_workspace(&self, id: i64) -> Result<Workspace, DomainError> {
        sqlx::query(
            r#"
            UPDATE sys_workspace
            SET name = CASE WHEN type = 'demo' THEN 'Demo Workspace' ELSE name END,
                updated_at = datetime('now', 'localtime')
            WHERE id = ?
            "#,
        )
        .bind(id)
        .execute(&self.pool)
        .await
        .map_err(DomainError::infra)?;

        sqlx::query_as::<_, WorkspaceRow>(&format!(
            "SELECT {WS_COLUMNS} FROM sys_workspace WHERE id = ?"
        ))
        .bind(id)
        .fetch_one(&self.pool)
        .await
        .map_err(DomainError::infra)
        .map(Workspace::from)
    }
}
