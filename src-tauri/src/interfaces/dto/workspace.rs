use serde::Serialize;

use crate::domain::workspace::entity::Workspace;

#[derive(Debug, Clone, Serialize)]
pub struct WorkspaceDto {
    pub id: i64,
    pub name: String,
    pub is_current: i64,
    pub r#type: String,
    pub created_at: Option<chrono::NaiveDateTime>,
    pub updated_at: Option<chrono::NaiveDateTime>,
}

impl From<Workspace> for WorkspaceDto {
    fn from(w: Workspace) -> Self {
        let is_current = w.is_current() as i64;
        Self {
            id: w.id,
            name: w.name,
            is_current,
            r#type: w.r#type.as_str().to_string(),
            created_at: w.created_at,
            updated_at: w.updated_at,
        }
    }
}
