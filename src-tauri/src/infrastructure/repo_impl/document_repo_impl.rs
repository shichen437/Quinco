use async_trait::async_trait;
use chrono::NaiveDateTime;
use sqlx::SqlitePool;

use crate::domain::document::entity::{
    DocExt, DocLink, DocType, Document, LinkChanges, NewDocument, UpdateDocContent,
};
use crate::domain::document::repo::DocumentRepository;
use crate::interfaces::dto::page::normalize_page;
use crate::shared::error::DomainError;

#[derive(sqlx::FromRow)]
struct DocumentRow {
    id: String,
    title: String,
    emoji: String,
    r#type: String,
    wid: i64,
    is_lock: i64,
    is_favorite: i64,
    is_delete: i64,
    deleted_at: Option<NaiveDateTime>,
    created_at: Option<NaiveDateTime>,
    updated_at: Option<NaiveDateTime>,
}

impl From<DocumentRow> for Document {
    fn from(r: DocumentRow) -> Self {
        Document::from_parts(
            r.id,
            r.title,
            r.emoji,
            DocType::parse_or_default(&r.r#type),
            r.wid,
            r.is_lock != 0,
            r.is_favorite != 0,
            r.is_delete != 0,
            r.deleted_at,
            r.created_at,
            r.updated_at,
        )
    }
}

#[derive(sqlx::FromRow)]
struct DocExtRow {
    id: i64,
    doc_id: String,
    content: Option<String>,
    plain_text: Option<String>,
    created_at: Option<NaiveDateTime>,
    updated_at: Option<NaiveDateTime>,
}

impl From<DocExtRow> for DocExt {
    fn from(r: DocExtRow) -> Self {
        Self {
            id: r.id,
            doc_id: r.doc_id,
            content: r.content,
            plain_text: r.plain_text,
            created_at: r.created_at,
            updated_at: r.updated_at,
        }
    }
}

#[derive(sqlx::FromRow)]
struct DocLinkRow {
    source_doc_id: String,
    target_doc_id: Option<String>,
}

impl From<DocLinkRow> for DocLink {
    fn from(r: DocLinkRow) -> Self {
        Self {
            source_doc_id: r.source_doc_id,
            target_doc_id: r.target_doc_id,
        }
    }
}

const DOC_COLUMNS: &str = "id, title, emoji, type, wid, is_lock, is_favorite, is_delete, deleted_at, created_at, updated_at";

pub struct DocumentRepoImpl {
    pool: SqlitePool,
}

impl DocumentRepoImpl {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    async fn load_raw_by_id(&self, id: &str) -> Result<DocumentRow, DomainError> {
        sqlx::query_as::<_, DocumentRow>(&format!("SELECT {DOC_COLUMNS} FROM sys_doc WHERE id = ?"))
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .map_err(DomainError::infra)?
            .ok_or_else(|| DomainError::not_found(format!("Document #{}", id)))
    }
}

#[async_trait]
impl DocumentRepository for DocumentRepoImpl {
    async fn get_by_id(&self, id: &str) -> Result<Document, DomainError> {
        sqlx::query_as::<_, DocumentRow>(&format!(
            "SELECT {DOC_COLUMNS} FROM sys_doc WHERE id = ? AND is_delete = 0"
        ))
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(DomainError::infra)?
        .map(Document::from)
        .ok_or_else(|| DomainError::not_found(format!("Document #{}", id)))
    }

    async fn get_by_id_including_deleted(&self, id: &str) -> Result<Document, DomainError> {
        self.load_raw_by_id(id).await.map(Document::from)
    }

    async fn get_by_workspace_paged(
        &self,
        wid: i64,
        page: i64,
        page_size: i64,
    ) -> Result<(Vec<Document>, i64), DomainError> {
        let (_page, page_size, offset) = normalize_page(page, page_size, 20, 100);

        let total: i64 =
            sqlx::query_scalar("SELECT COUNT(*) FROM sys_doc WHERE wid = ? AND is_delete = 0")
                .bind(wid)
                .fetch_one(&self.pool)
                .await
                .map_err(DomainError::infra)?;

        let items = if total == 0 {
            Vec::new()
        } else {
            sqlx::query_as::<_, DocumentRow>(&format!(
                "SELECT {DOC_COLUMNS} FROM sys_doc WHERE wid = ? AND is_delete = 0 ORDER BY updated_at DESC LIMIT ? OFFSET ?"
            ))
            .bind(wid)
            .bind(page_size)
            .bind(offset)
            .fetch_all(&self.pool)
            .await
            .map_err(DomainError::infra)?
            .into_iter()
            .map(Document::from)
            .collect()
        };

        Ok((items, total))
    }

    async fn get_favorites(&self, wid: i64) -> Result<Vec<Document>, DomainError> {
        sqlx::query_as::<_, DocumentRow>(&format!(
            "SELECT {DOC_COLUMNS} FROM sys_doc WHERE wid = ? AND is_delete = 0 AND is_favorite = 1 ORDER BY updated_at DESC"
        ))
        .bind(wid)
        .fetch_all(&self.pool)
        .await
        .map_err(DomainError::infra)
        .map(|rows| rows.into_iter().map(Document::from).collect())
    }

    async fn get_deleted_paged(
        &self,
        wid: i64,
        page: i64,
        page_size: i64,
    ) -> Result<(Vec<Document>, i64), DomainError> {
        let (_page, page_size, offset) = normalize_page(page, page_size, 20, 100);

        let total: i64 =
            sqlx::query_scalar("SELECT COUNT(*) FROM sys_doc WHERE wid = ? AND is_delete = 1")
                .bind(wid)
                .fetch_one(&self.pool)
                .await
                .map_err(DomainError::infra)?;

        let items = if total == 0 {
            Vec::new()
        } else {
            sqlx::query_as::<_, DocumentRow>(&format!(
                "SELECT {DOC_COLUMNS} FROM sys_doc WHERE wid = ? AND is_delete = 1 ORDER BY deleted_at DESC LIMIT ? OFFSET ?"
            ))
            .bind(wid)
            .bind(page_size)
            .bind(offset)
            .fetch_all(&self.pool)
            .await
            .map_err(DomainError::infra)?
            .into_iter()
            .map(Document::from)
            .collect()
        };

        Ok((items, total))
    }

    async fn get_recent_documents(
        &self,
        wid: i64,
        page_size: i64,
    ) -> Result<Vec<Document>, DomainError> {
        sqlx::query_as::<_, DocumentRow>(&format!(
            "SELECT {DOC_COLUMNS} FROM sys_doc WHERE wid = ? AND is_delete = 0 ORDER BY updated_at DESC LIMIT ?"
        ))
        .bind(wid)
        .bind(page_size)
        .fetch_all(&self.pool)
        .await
        .map_err(DomainError::infra)
        .map(|rows| rows.into_iter().map(Document::from).collect())
    }

    async fn doc_search(
        &self,
        wid: i64,
        keyword: &str,
        page_size: i64,
    ) -> Result<Vec<Document>, DomainError> {
        let keyword_pattern = if keyword.trim().is_empty() {
            "%".to_string()
        } else {
            format!("%{}%", keyword)
        };
        sqlx::query_as::<_, DocumentRow>(&format!(
            "SELECT {DOC_COLUMNS} FROM sys_doc WHERE wid = ? AND is_delete = 0 AND title LIKE ? ORDER BY updated_at DESC LIMIT ?"
        ))
        .bind(wid)
        .bind(keyword_pattern)
        .bind(page_size)
        .fetch_all(&self.pool)
        .await
        .map_err(DomainError::infra)
        .map(|rows| rows.into_iter().map(Document::from).collect())
    }

    async fn create(&self, doc: NewDocument) -> Result<Document, DomainError> {
        let mut tx = self.pool.begin().await.map_err(DomainError::infra)?;

        sqlx::query(
            r#"
            INSERT INTO sys_doc (id, type, wid, title)
            VALUES (?, 'doc', ?, ?)
            "#,
        )
        .bind(&doc.id)
        .bind(doc.wid)
        .bind(&doc.title)
        .execute(&mut *tx)
        .await
        .map_err(DomainError::infra)?;

        sqlx::query(
            r#"
            INSERT INTO sys_doc_ext (doc_id, content, plain_text)
            VALUES (?, ?, ?)
            "#,
        )
        .bind(&doc.id)
        .bind("")
        .bind("")
        .execute(&mut *tx)
        .await
        .map_err(DomainError::infra)?;

        sqlx::query(
            r#"
            INSERT INTO sys_doc_link (source_doc_id, target_doc_id, wid)
            VALUES (?, ?, ?)
            "#,
        )
        .bind(&doc.id)
        .bind(&doc.id)
        .bind(doc.wid)
        .execute(&mut *tx)
        .await
        .map_err(DomainError::infra)?;

        let result: Document = sqlx::query_as::<_, DocumentRow>(&format!(
            "SELECT {DOC_COLUMNS} FROM sys_doc WHERE id = ?"
        ))
        .bind(&doc.id)
        .fetch_one(&mut *tx)
        .await
        .map_err(DomainError::infra)
        .map(Document::from)?;

        tx.commit().await.map_err(DomainError::infra)?;

        Ok(result)
    }

    async fn update_content(
        &self,
        update: UpdateDocContent,
        changes: &LinkChanges,
    ) -> Result<(), DomainError> {
        let mut tx = self.pool.begin().await.map_err(DomainError::infra)?;

        sqlx::query(
            r#"
            UPDATE sys_doc_ext
            SET content = ?, plain_text = ?, updated_at = datetime('now', 'localtime')
            WHERE doc_id = ?
            "#,
        )
        .bind(&update.content)
        .bind(&update.plain_text)
        .bind(&update.doc_id)
        .execute(&mut *tx)
        .await
        .map_err(DomainError::infra)?;

        let wid: Option<i64> = sqlx::query_scalar("SELECT wid FROM sys_doc WHERE id = ?")
            .bind(&update.doc_id)
            .fetch_optional(&mut *tx)
            .await
            .map_err(DomainError::infra)?;

        if let Some(wid) = wid {
            for removed in &changes.removed {
                sqlx::query(
                    "DELETE FROM sys_doc_link WHERE source_doc_id = ? AND target_doc_id = ?",
                )
                .bind(&update.doc_id)
                .bind(removed)
                .execute(&mut *tx)
                .await
                .map_err(DomainError::infra)?;
            }

            for added in &changes.added {
                sqlx::query(
                    r#"
                    INSERT OR IGNORE INTO sys_doc_link (source_doc_id, target_doc_id, wid)
                    VALUES (?, ?, ?)
                    "#,
                )
                .bind(&update.doc_id)
                .bind(added)
                .bind(wid)
                .execute(&mut *tx)
                .await
                .map_err(DomainError::infra)?;
            }
        }

        sqlx::query(
            r#"
            UPDATE sys_doc
            SET updated_at = datetime('now', 'localtime')
            WHERE id = ?
            "#,
        )
        .bind(&update.doc_id)
        .execute(&mut *tx)
        .await
        .map_err(DomainError::infra)?;

        tx.commit().await.map_err(DomainError::infra)?;

        Ok(())
    }

    async fn get_content(&self, doc_id: &str) -> Result<DocExt, DomainError> {
        sqlx::query_as::<_, DocExtRow>(
            r#"
            SELECT id, doc_id, content, plain_text, created_at, updated_at
            FROM sys_doc_ext
            WHERE doc_id = ?
            "#,
        )
        .bind(doc_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(DomainError::infra)?
        .map(DocExt::from)
        .ok_or_else(|| DomainError::not_found(format!("Document content #{}", doc_id)))
    }

    async fn get_link_targets(&self, doc_id: &str) -> Result<Vec<String>, DomainError> {
        let rows: Vec<(String,)> = sqlx::query_as(
            r#"
            SELECT target_doc_id FROM sys_doc_link
            WHERE source_doc_id = ? AND target_doc_id != ?
            "#,
        )
        .bind(doc_id)
        .bind(doc_id)
        .fetch_all(&self.pool)
        .await
        .map_err(DomainError::infra)?;

        Ok(rows.into_iter().map(|(target,)| target).collect())
    }

    async fn save(&self, doc: &Document) -> Result<(), DomainError> {
        sqlx::query(
            r#"
            UPDATE sys_doc
            SET title = ?, is_lock = ?, is_favorite = ?, is_delete = ?, deleted_at = ?,
                updated_at = datetime('now', 'localtime')
            WHERE id = ?
            "#,
        )
        .bind(&doc.title)
        .bind(doc.is_locked() as i64)
        .bind(doc.is_favorite() as i64)
        .bind(doc.is_deleted() as i64)
        .bind(doc.deleted_at)
        .bind(&doc.id)
        .execute(&self.pool)
        .await
        .map_err(DomainError::infra)?;

        Ok(())
    }

    async fn hard_delete(&self, id: &str) -> Result<(), DomainError> {
        let mut tx = self.pool.begin().await.map_err(DomainError::infra)?;

        sqlx::query("DELETE FROM sys_doc_link WHERE source_doc_id = ? OR target_doc_id = ?")
            .bind(id)
            .bind(id)
            .execute(&mut *tx)
            .await
            .map_err(DomainError::infra)?;

        sqlx::query("DELETE FROM sys_doc_ext WHERE doc_id = ?")
            .bind(id)
            .execute(&mut *tx)
            .await
            .map_err(DomainError::infra)?;

        sqlx::query("DELETE FROM sys_doc WHERE id = ?")
            .bind(id)
            .execute(&mut *tx)
            .await
            .map_err(DomainError::infra)?;

        tx.commit().await.map_err(DomainError::infra)?;

        Ok(())
    }

    async fn hard_delete_all_by_workspace(&self, wid: i64) -> Result<(), DomainError> {
        let mut tx = self.pool.begin().await.map_err(DomainError::infra)?;

        sqlx::query(
            r#"
            DELETE FROM sys_file_ref
            WHERE doc_id IN (SELECT id FROM sys_doc WHERE wid = ?)
            "#,
        )
        .bind(wid)
        .execute(&mut *tx)
        .await
        .map_err(DomainError::infra)?;

        sqlx::query(
            r#"
            DELETE FROM sys_tag_link
            WHERE doc_id IN (SELECT id FROM sys_doc WHERE wid = ?)
            "#,
        )
        .bind(wid)
        .execute(&mut *tx)
        .await
        .map_err(DomainError::infra)?;

        sqlx::query("DELETE FROM sys_doc_link WHERE wid = ?")
            .bind(wid)
            .execute(&mut *tx)
            .await
            .map_err(DomainError::infra)?;

        sqlx::query(
            r#"
            DELETE FROM sys_doc_ext
            WHERE doc_id IN (SELECT id FROM sys_doc WHERE wid = ?)
            "#,
        )
        .bind(wid)
        .execute(&mut *tx)
        .await
        .map_err(DomainError::infra)?;

        sqlx::query("DELETE FROM sys_doc WHERE wid = ?")
            .bind(wid)
            .execute(&mut *tx)
            .await
            .map_err(DomainError::infra)?;

        tx.commit().await.map_err(DomainError::infra)?;

        Ok(())
    }

    async fn get_backlinks(&self, doc_id: &str) -> Result<Vec<Document>, DomainError> {
        let doc_columns = crate::shared::sql::qualified("d", DOC_COLUMNS);
        sqlx::query_as::<_, DocumentRow>(&format!(
            r#"
            SELECT {doc_columns}
            FROM sys_doc d
            INNER JOIN sys_doc_link l ON d.id = l.source_doc_id
            WHERE l.target_doc_id = ? AND l.source_doc_id != ? AND d.is_delete = 0
            ORDER BY d.updated_at DESC
            "#
        ))
        .bind(doc_id)
        .bind(doc_id)
        .fetch_all(&self.pool)
        .await
        .map_err(DomainError::infra)
        .map(|rows| rows.into_iter().map(Document::from).collect())
    }

    async fn get_all_links(&self, wid: i64) -> Result<Vec<DocLink>, DomainError> {
        sqlx::query_as::<_, DocLinkRow>(
            r#"
            SELECT source_doc_id, target_doc_id
            FROM sys_doc_link
            WHERE wid = ? AND source_doc_id != target_doc_id
            "#,
        )
        .bind(wid)
        .fetch_all(&self.pool)
        .await
        .map_err(DomainError::infra)
        .map(|rows| rows.into_iter().map(DocLink::from).collect())
    }

    async fn get_all_including_deleted(&self, wid: i64) -> Result<Vec<Document>, DomainError> {
        sqlx::query_as::<_, DocumentRow>(&format!(
            "SELECT {DOC_COLUMNS} FROM sys_doc WHERE wid = ? ORDER BY is_delete ASC, updated_at DESC"
        ))
        .bind(wid)
        .fetch_all(&self.pool)
        .await
        .map_err(DomainError::infra)
        .map(|rows| rows.into_iter().map(Document::from).collect())
    }
}
