use async_trait::async_trait;
use chrono::NaiveDateTime;
use sqlx::SqlitePool;

use crate::domain::tag::entity::{NewTag, Tag};
use crate::domain::tag::repo::TagRepository;
use crate::interfaces::dto::page::normalize_page;
use crate::shared::error::DomainError;

#[derive(sqlx::FromRow)]
struct TagRow {
    id: i64,
    name: String,
    color: Option<String>,
    wid: i64,
    created_at: Option<NaiveDateTime>,
    updated_at: Option<NaiveDateTime>,
}

impl From<TagRow> for Tag {
    fn from(r: TagRow) -> Self {
        Self {
            id: r.id,
            name: r.name,
            color: r.color.unwrap_or_else(|| DEFAULT_TAG_COLOR.to_string()),
            wid: r.wid,
            created_at: r.created_at,
            updated_at: r.updated_at,
        }
    }
}

const TAG_COLUMNS: &str = "id, name, color, wid, created_at, updated_at";

const DEFAULT_TAG_COLOR: &str = "#6b7280";

pub struct TagRepoImpl {
    pool: SqlitePool,
}

impl TagRepoImpl {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl TagRepository for TagRepoImpl {
    async fn get_by_workspace_paged(
        &self,
        wid: i64,
        page: i64,
        page_size: i64,
    ) -> Result<(Vec<Tag>, i64), DomainError> {
        let (_page, page_size, offset) = normalize_page(page, page_size, 20, 100);

        let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM sys_tag WHERE wid = ?")
            .bind(wid)
            .fetch_one(&self.pool)
            .await
            .map_err(DomainError::infra)?;

        let items = if total == 0 {
            Vec::new()
        } else {
            sqlx::query_as::<_, TagRow>(&format!(
                "SELECT {TAG_COLUMNS} FROM sys_tag WHERE wid = ? ORDER BY created_at DESC LIMIT ? OFFSET ?"
            ))
            .bind(wid)
            .bind(page_size)
            .bind(offset)
            .fetch_all(&self.pool)
            .await
            .map_err(DomainError::infra)?
            .into_iter()
            .map(Tag::from)
            .collect()
        };

        Ok((items, total))
    }

    async fn find_by_name(&self, wid: i64, name: &str) -> Result<Option<Tag>, DomainError> {
        sqlx::query_as::<_, TagRow>(&format!(
            "SELECT {TAG_COLUMNS} FROM sys_tag WHERE wid = ? AND name = ?"
        ))
        .bind(wid)
        .bind(name)
        .fetch_optional(&self.pool)
        .await
        .map_err(DomainError::infra)
        .map(|row| row.map(Tag::from))
    }

    async fn create_or_get(&self, tag: NewTag) -> Result<Tag, DomainError> {
        if let Some(existing) = self.find_by_name(tag.wid, &tag.name).await? {
            return Ok(existing);
        }

        let result = sqlx::query(
            r#"
            INSERT INTO sys_tag (name, color, wid)
            VALUES (?, ?, ?)
            "#,
        )
        .bind(&tag.name)
        .bind(&tag.color)
        .bind(tag.wid)
        .execute(&self.pool)
        .await
        .map_err(DomainError::infra)?;

        let id = result.last_insert_rowid();

        sqlx::query_as::<_, TagRow>(&format!("SELECT {TAG_COLUMNS} FROM sys_tag WHERE id = ?"))
            .bind(id)
            .fetch_one(&self.pool)
            .await
            .map_err(DomainError::infra)
            .map(Tag::from)
    }

    async fn get_by_doc(&self, doc_id: &str) -> Result<Vec<Tag>, DomainError> {
        let tag_columns = crate::shared::sql::qualified("t", TAG_COLUMNS);
        sqlx::query_as::<_, TagRow>(&format!(
            r#"
            SELECT {tag_columns}
            FROM sys_tag t
            INNER JOIN sys_tag_link tl ON tl.tid = t.id
            WHERE tl.doc_id = ?
            ORDER BY t.created_at DESC
            "#
        ))
        .bind(doc_id)
        .fetch_all(&self.pool)
        .await
        .map_err(DomainError::infra)
        .map(|rows| rows.into_iter().map(Tag::from).collect())
    }

    async fn link_to_doc(&self, tid: i64, doc_id: &str) -> Result<(), DomainError> {
        sqlx::query(
            r#"
            INSERT OR IGNORE INTO sys_tag_link (tid, doc_id)
            VALUES (?, ?)
            "#,
        )
        .bind(tid)
        .bind(doc_id)
        .execute(&self.pool)
        .await
        .map_err(DomainError::infra)?;

        Ok(())
    }

    async fn unlink_from_doc(&self, tid: i64, doc_id: &str) -> Result<(), DomainError> {
        sqlx::query(
            r#"
            DELETE FROM sys_tag_link
            WHERE tid = ? AND doc_id = ?
            "#,
        )
        .bind(tid)
        .bind(doc_id)
        .execute(&self.pool)
        .await
        .map_err(DomainError::infra)?;

        Ok(())
    }

    async fn get_doc_tag_ids(&self, doc_id: &str) -> Result<Vec<i64>, DomainError> {
        let rows: Vec<(i64,)> = sqlx::query_as("SELECT tid FROM sys_tag_link WHERE doc_id = ?")
            .bind(doc_id)
            .fetch_all(&self.pool)
            .await
            .map_err(DomainError::infra)?;

        Ok(rows.into_iter().map(|r| r.0).collect())
    }

    async fn update(&self, tid: i64, name: &str, color: &str) -> Result<Tag, DomainError> {
        sqlx::query(
            r#"
            UPDATE sys_tag
            SET name = ?, color = ?, updated_at = datetime('now')
            WHERE id = ?
            "#,
        )
        .bind(name)
        .bind(color)
        .bind(tid)
        .execute(&self.pool)
        .await
        .map_err(DomainError::infra)?;

        sqlx::query_as::<_, TagRow>(&format!("SELECT {TAG_COLUMNS} FROM sys_tag WHERE id = ?"))
            .bind(tid)
            .fetch_one(&self.pool)
            .await
            .map_err(DomainError::infra)
            .map(Tag::from)
    }

    async fn delete(&self, tid: i64) -> Result<(), DomainError> {
        sqlx::query("DELETE FROM sys_tag_link WHERE tid = ?")
            .bind(tid)
            .execute(&self.pool)
            .await
            .map_err(DomainError::infra)?;

        sqlx::query("DELETE FROM sys_tag WHERE id = ?")
            .bind(tid)
            .execute(&self.pool)
            .await
            .map_err(DomainError::infra)?;

        Ok(())
    }

    async fn delete_all_in_workspace(&self, wid: i64) -> Result<(), DomainError> {
        sqlx::query("DELETE FROM sys_tag WHERE wid = ?")
            .bind(wid)
            .execute(&self.pool)
            .await
            .map_err(DomainError::infra)?;

        Ok(())
    }

    async fn get_tag_doc_ids(&self, tid: i64) -> Result<Vec<String>, DomainError> {
        let rows: Vec<(String,)> =
            sqlx::query_as("SELECT doc_id FROM sys_tag_link WHERE tid = ? ORDER BY rowid DESC")
                .bind(tid)
                .fetch_all(&self.pool)
                .await
                .map_err(DomainError::infra)?;

        Ok(rows.into_iter().map(|r| r.0).collect())
    }
}
