use serde::Serialize;

use crate::domain::document::entity::{DocExt, Document, GraphData};

#[derive(Debug, Clone, Serialize)]
pub struct DocumentDto {
    pub id: String,
    pub title: String,
    pub emoji: String,
    pub r#type: String,
    pub wid: i64,
    pub is_lock: i64,
    pub is_favorite: i64,
    pub is_delete: i64,
    pub deleted_at: Option<chrono::NaiveDateTime>,
    pub created_at: Option<chrono::NaiveDateTime>,
    pub updated_at: Option<chrono::NaiveDateTime>,
}

impl From<Document> for DocumentDto {
    fn from(d: Document) -> Self {
        let is_lock = d.is_locked() as i64;
        let is_favorite = d.is_favorite() as i64;
        let is_delete = d.is_deleted() as i64;
        Self {
            id: d.id,
            title: d.title,
            emoji: d.emoji,
            r#type: d.r#type.as_str().to_string(),
            wid: d.wid,
            is_lock,
            is_favorite,
            is_delete,
            deleted_at: d.deleted_at,
            created_at: d.created_at,
            updated_at: d.updated_at,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct DocExtDto {
    pub id: i64,
    pub doc_id: String,
    pub content: Option<String>,
    pub plain_text: Option<String>,
    pub created_at: Option<chrono::NaiveDateTime>,
    pub updated_at: Option<chrono::NaiveDateTime>,
}

impl From<DocExt> for DocExtDto {
    fn from(e: DocExt) -> Self {
        Self {
            id: e.id,
            doc_id: e.doc_id,
            content: e.content,
            plain_text: e.plain_text,
            created_at: e.created_at,
            updated_at: e.updated_at,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct GraphDataDto {
    pub nodes: Vec<DocumentDto>,
    pub links: Vec<(String, String)>,
}

impl From<GraphData> for GraphDataDto {
    fn from(g: GraphData) -> Self {
        Self {
            nodes: g.nodes.into_iter().map(DocumentDto::from).collect(),
            links: g
                .links
                .into_iter()
                .map(|l| (l.source_doc_id, l.target_doc_id.unwrap_or_default()))
                .collect(),
        }
    }
}
