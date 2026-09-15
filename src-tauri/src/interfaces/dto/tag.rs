use serde::Serialize;

use crate::domain::tag::entity::Tag;

#[derive(Debug, Clone, Serialize)]
pub struct TagDto {
    pub id: i64,
    pub name: String,
    pub color: String,
    pub wid: i64,
    pub created_at: Option<chrono::NaiveDateTime>,
    pub updated_at: Option<chrono::NaiveDateTime>,
}

impl From<Tag> for TagDto {
    fn from(t: Tag) -> Self {
        Self {
            id: t.id,
            name: t.name,
            color: t.color,
            wid: t.wid,
            created_at: t.created_at,
            updated_at: t.updated_at,
        }
    }
}
