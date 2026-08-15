use serde::Serialize;
use sqlx::FromRow;

use super::doc::DocListItem;

pub const DOC_PROTOCOL_PREFIX: &str = "quinco://localhost/doc/";

pub fn parse_doc_id(url: &str) -> Option<String> {
    let rest = url.strip_prefix(DOC_PROTOCOL_PREFIX)?;
    let id = rest.split(['/', '?', '#']).next()?;
    if id.is_empty() {
        None
    } else {
        Some(id.to_string())
    }
}

#[derive(Debug, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct DocLinkItem {
    pub id: String,
    pub title: String,
    pub emoji: String,
    pub is_delete: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DocBidirectionalLinks {
    pub reverse_links: Vec<DocLinkItem>,
}

pub struct ReferenceSearchCriteria {
    pub keyword: String,
    pub limit: i64,
}

impl ReferenceSearchCriteria {
    pub fn new(query: &str, limit: i64) -> Self {
        ReferenceSearchCriteria {
            keyword: query.trim().to_string(),
            limit: limit.clamp(1, 20),
        }
    }

    pub fn is_empty(&self) -> bool {
        self.keyword.is_empty()
    }
}

pub type ReferenceCandidates = Vec<DocListItem>;

#[derive(Debug, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct GraphNode {
    pub id: String,
    pub title: String,
    pub emoji: String,
    pub is_delete: i64,
}

#[derive(Debug, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct GraphEdge {
    pub source: String,
    pub target: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphData {
    pub nodes: Vec<GraphNode>,
    pub edges: Vec<GraphEdge>,
}
