use serde::Serialize;
use sqlx::FromRow;

use super::error::DomainError;

#[derive(Debug, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct TagItem {
    pub id: i64,
    pub name: String,
}

pub fn normalize_tag_name(name: &str) -> Result<String, DomainError> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err(DomainError::validation("tag name cannot be empty"));
    }
    Ok(trimmed.to_string())
}
