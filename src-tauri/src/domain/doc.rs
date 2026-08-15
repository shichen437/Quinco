use serde::Serialize;
use sqlx::FromRow;

use super::error::DomainError;

#[derive(Debug, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct DocListItem {
    pub id: String,
    pub title: String,
    pub emoji: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct DocDetail {
    pub id: String,
    pub title: String,
    pub emoji: String,
    pub wid: i64,
    pub is_lock: i64,
    pub is_favorite: i64,
    pub is_delete: i64,
    pub deleted_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct DocWithContent {
    pub id: String,
    pub title: String,
    pub emoji: String,
    pub wid: i64,
    pub is_lock: i64,
    pub is_favorite: i64,
    pub is_delete: i64,
    pub deleted_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub content: String,
}

#[derive(Debug, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct TrashDocItem {
    pub id: String,
    pub title: String,
    pub emoji: String,
    pub deleted_at: Option<String>,
}

pub fn ensure_editable(
    lock_flag: Option<i64>,
    subject: Option<&'static str>,
) -> Result<(), DomainError> {
    match lock_flag {
        None => match subject {
            Some(s) => Err(DomainError::subject_not_found(s, "document")),
            None => Err(DomainError::not_found("document")),
        },
        Some(1) => match subject {
            Some(s) => Err(DomainError::subject_locked(s)),
            None => Err(DomainError::locked()),
        },
        _ => Ok(()),
    }
}
