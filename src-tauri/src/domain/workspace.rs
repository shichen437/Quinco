use serde::Serialize;
use sqlx::FromRow;

use super::error::DomainError;

#[derive(Debug, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Workspace {
    pub id: i64,
    pub name: String,
    pub is_current: i64,
    pub r#type: String,
}

pub fn normalize_workspace_name(name: &str) -> Result<String, DomainError> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err(DomainError::validation("workspace name cannot be empty"));
    }
    Ok(trimmed.to_string())
}
