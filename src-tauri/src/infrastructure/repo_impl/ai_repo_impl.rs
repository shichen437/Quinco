use async_trait::async_trait;
use chrono::NaiveDateTime;
use sqlx::SqlitePool;

use crate::domain::ai::entity::{AiChatMessage, AiChatSession, NewAiChatMessage, NewAiChatSession};
use crate::domain::ai::repo::AiSessionRepository;
use crate::shared::error::DomainError;

#[derive(sqlx::FromRow)]
struct ChatSessionRow {
    id: String,
    title: String,
    model: String,
    provider: String,
    wid: i64,
    created_at: Option<NaiveDateTime>,
    updated_at: Option<NaiveDateTime>,
}

impl From<ChatSessionRow> for AiChatSession {
    fn from(r: ChatSessionRow) -> Self {
        AiChatSession {
            id: r.id,
            title: r.title,
            model: r.model,
            provider: r.provider,
            wid: r.wid,
            created_at: r.created_at,
            updated_at: r.updated_at,
        }
    }
}

#[derive(sqlx::FromRow)]
struct ChatMessageRow {
    id: i64,
    sid: String,
    role: String,
    content: String,
    created_at: Option<NaiveDateTime>,
}

impl From<ChatMessageRow> for AiChatMessage {
    fn from(r: ChatMessageRow) -> Self {
        AiChatMessage {
            id: r.id,
            sid: r.sid,
            role: r.role,
            content: r.content,
            created_at: r.created_at,
        }
    }
}

const SESSION_COLUMNS: &str = "id, title, model, provider, wid, created_at, updated_at";
const MESSAGE_COLUMNS: &str = "id, sid, role, content, created_at";

pub struct AiSessionRepoImpl {
    pool: SqlitePool,
}

impl AiSessionRepoImpl {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl AiSessionRepository for AiSessionRepoImpl {
    async fn delete_all_by_workspace(&self, wid: i64) -> Result<(), DomainError> {
        let mut tx = self.pool.begin().await.map_err(DomainError::infra)?;

        sqlx::query(
            r#"
            DELETE FROM ai_chat_messages
            WHERE sid IN (SELECT id FROM ai_chat_sessions WHERE wid = ?)
            "#,
        )
        .bind(wid)
        .execute(&mut *tx)
        .await
        .map_err(DomainError::infra)?;

        sqlx::query("DELETE FROM ai_chat_sessions WHERE wid = ?")
            .bind(wid)
            .execute(&mut *tx)
            .await
            .map_err(DomainError::infra)?;

        tx.commit().await.map_err(DomainError::infra)?;

        Ok(())
    }

    async fn create_session(
        &self,
        session: NewAiChatSession,
    ) -> Result<AiChatSession, DomainError> {
        sqlx::query_as::<_, ChatSessionRow>(&format!(
            "INSERT INTO ai_chat_sessions (id, title, model, provider, wid) VALUES (?, ?, ?, ?, ?) RETURNING {SESSION_COLUMNS}"
        ))
        .bind(session.id())
        .bind(session.title())
        .bind(session.model())
        .bind(session.provider())
        .bind(session.wid())
        .fetch_one(&self.pool)
        .await
        .map_err(DomainError::infra)
        .map(AiChatSession::from)
    }

    async fn get_session(&self, sid: &str) -> Result<AiChatSession, DomainError> {
        sqlx::query_as::<_, ChatSessionRow>(&format!(
            "SELECT {SESSION_COLUMNS} FROM ai_chat_sessions WHERE id = ?"
        ))
        .bind(sid)
        .fetch_optional(&self.pool)
        .await
        .map_err(DomainError::infra)?
        .map(AiChatSession::from)
        .ok_or_else(|| DomainError::not_found(format!("Chat session #{sid}")))
    }

    async fn list_sessions(&self, wid: i64) -> Result<Vec<AiChatSession>, DomainError> {
        sqlx::query_as::<_, ChatSessionRow>(&format!(
            "SELECT {SESSION_COLUMNS} FROM ai_chat_sessions WHERE wid = ? ORDER BY updated_at DESC, id DESC"
        ))
        .bind(wid)
        .fetch_all(&self.pool)
        .await
        .map_err(DomainError::infra)
        .map(|rows| rows.into_iter().map(AiChatSession::from).collect())
    }

    async fn delete_session(&self, sid: &str) -> Result<(), DomainError> {
        let mut tx = self.pool.begin().await.map_err(DomainError::infra)?;

        sqlx::query("DELETE FROM ai_chat_messages WHERE sid = ?")
            .bind(sid)
            .execute(&mut *tx)
            .await
            .map_err(DomainError::infra)?;

        let result = sqlx::query("DELETE FROM ai_chat_sessions WHERE id = ?")
            .bind(sid)
            .execute(&mut *tx)
            .await
            .map_err(DomainError::infra)?;

        tx.commit().await.map_err(DomainError::infra)?;

        if result.rows_affected() == 0 {
            return Err(DomainError::not_found(format!("Chat session #{sid}")));
        }

        Ok(())
    }

    async fn append_message(
        &self,
        message: NewAiChatMessage,
    ) -> Result<AiChatMessage, DomainError> {
        let mut tx = self.pool.begin().await.map_err(DomainError::infra)?;

        let row = sqlx::query_as::<_, ChatMessageRow>(&format!(
            "INSERT INTO ai_chat_messages (sid, role, content) VALUES (?, ?, ?) RETURNING {MESSAGE_COLUMNS}"
        ))
        .bind(message.sid())
        .bind(message.role())
        .bind(message.content())
        .fetch_one(&mut *tx)
        .await
        .map_err(DomainError::infra)?;

        sqlx::query(
            "UPDATE ai_chat_sessions SET updated_at = datetime('now', 'localtime') WHERE id = ?",
        )
        .bind(message.sid())
        .execute(&mut *tx)
        .await
        .map_err(DomainError::infra)?;

        tx.commit().await.map_err(DomainError::infra)?;

        Ok(AiChatMessage::from(row))
    }

    async fn list_messages(&self, sid: &str) -> Result<Vec<AiChatMessage>, DomainError> {
        sqlx::query_as::<_, ChatMessageRow>(&format!(
            "SELECT {MESSAGE_COLUMNS} FROM ai_chat_messages WHERE sid = ? ORDER BY id ASC"
        ))
        .bind(sid)
        .fetch_all(&self.pool)
        .await
        .map_err(DomainError::infra)
        .map(|rows| rows.into_iter().map(AiChatMessage::from).collect())
    }

    async fn update_session_model(
        &self,
        sid: &str,
        provider: &str,
        model: &str,
    ) -> Result<(), DomainError> {
        sqlx::query(
            "UPDATE ai_chat_sessions SET provider = ?, model = ?, updated_at = datetime('now', 'localtime') WHERE id = ?",
        )
        .bind(provider)
        .bind(model)
        .bind(sid)
        .execute(&self.pool)
        .await
        .map_err(DomainError::infra)?;
        Ok(())
    }
}
