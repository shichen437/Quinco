use std::collections::HashSet;

use chrono::NaiveDateTime;

use crate::shared::error::DomainError;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DocType {
    Doc,
}

impl Default for DocType {
    fn default() -> Self {
        DocType::Doc
    }
}

impl DocType {
    pub fn as_str(&self) -> &'static str {
        match self {
            DocType::Doc => "doc",
        }
    }

    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "doc" => Some(DocType::Doc),
            _ => None,
        }
    }

    pub fn parse_or_default(s: &str) -> Self {
        Self::parse(s).unwrap_or_default()
    }
}

#[derive(Debug, Clone)]
pub struct Document {
    pub id: String,
    pub title: String,
    pub emoji: String,
    pub r#type: DocType,
    pub wid: i64,
    is_lock: bool,
    is_favorite: bool,
    is_delete: bool,
    pub deleted_at: Option<NaiveDateTime>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

impl Document {
    pub(crate) fn from_parts(
        id: String,
        title: String,
        emoji: String,
        r#type: DocType,
        wid: i64,
        is_lock: bool,
        is_favorite: bool,
        is_delete: bool,
        deleted_at: Option<NaiveDateTime>,
        created_at: Option<NaiveDateTime>,
        updated_at: Option<NaiveDateTime>,
    ) -> Self {
        Self {
            id,
            title,
            emoji,
            r#type,
            wid,
            is_lock,
            is_favorite,
            is_delete,
            deleted_at,
            created_at,
            updated_at,
        }
    }

    pub fn is_locked(&self) -> bool {
        self.is_lock
    }

    pub fn is_favorite(&self) -> bool {
        self.is_favorite
    }

    pub fn is_deleted(&self) -> bool {
        self.is_delete
    }

    pub fn toggle_favorite(&mut self) -> Result<bool, DomainError> {
        if self.is_delete {
            return Err(DomainError::illegal_operation(
                "cannot favorite a deleted document",
            ));
        }
        self.is_favorite = !self.is_favorite;
        Ok(self.is_favorite)
    }

    pub fn toggle_lock(&mut self) -> Result<bool, DomainError> {
        if self.is_delete {
            return Err(DomainError::illegal_operation(
                "cannot lock a deleted document",
            ));
        }
        self.is_lock = !self.is_lock;
        Ok(self.is_lock)
    }

    pub fn mark_deleted(&mut self) -> &mut Self {
        self.is_delete = true;
        self.is_favorite = false;
        self.is_lock = false;
        if self.deleted_at.is_none() {
            self.deleted_at = Some(chrono::Local::now().naive_local());
        }
        self
    }

    pub fn restore(&mut self) -> &mut Self {
        self.is_delete = false;
        self.deleted_at = None;
        self
    }

    pub fn rename(&mut self, title: impl Into<String>) -> &mut Self {
        self.title = title.into();
        self
    }
}

#[derive(Debug, Clone)]
pub struct DocExt {
    pub id: i64,
    pub doc_id: String,
    pub content: Option<String>,
    pub plain_text: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone)]
pub struct DocLink {
    pub source_doc_id: String,
    pub target_doc_id: Option<String>,
}

#[derive(Debug, Clone)]
pub struct GraphData {
    pub nodes: Vec<Document>,
    pub links: Vec<DocLink>,
}

#[derive(Debug, Clone)]
pub struct NewDocument {
    pub id: String,
    pub wid: i64,
    pub title: String,
}

impl NewDocument {
    pub fn new(id: impl Into<String>, wid: i64) -> Self {
        Self {
            id: id.into(),
            wid,
            title: String::new(),
        }
    }

    pub fn with_title(id: impl Into<String>, wid: i64, title: impl Into<String>) -> Self {
        Self {
            id: id.into(),
            wid,
            title: title.into(),
        }
    }
}

#[derive(Debug, Clone)]
pub struct UpdateDocContent {
    pub doc_id: String,
    pub content: String,
    pub plain_text: String,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct LinkChanges {
    pub added: Vec<String>,
    pub removed: Vec<String>,
}

impl LinkChanges {
    pub fn compute(current: &[String], incoming: &[String]) -> Self {
        let current_set: HashSet<&str> = current.iter().map(String::as_str).collect();
        let incoming_set: HashSet<&str> = incoming.iter().map(String::as_str).collect();

        let added = incoming
            .iter()
            .filter(|id| !current_set.contains(id.as_str()))
            .cloned()
            .collect();
        let removed = current
            .iter()
            .filter(|id| !incoming_set.contains(id.as_str()))
            .cloned()
            .collect();

        Self { added, removed }
    }
}

pub fn extract_doc_reference_ids(content: &str) -> Vec<String> {
    let mut doc_ids = HashSet::new();
    if let Ok(value) = serde_json::from_str::<serde_json::Value>(content) {
        collect_doc_refs(&value, &mut doc_ids);
    }
    doc_ids.into_iter().collect()
}

fn collect_doc_refs(value: &serde_json::Value, doc_ids: &mut HashSet<String>) {
    match value {
        serde_json::Value::Object(map) => {
            if let Some(serde_json::Value::String(t)) = map.get("type") {
                if t == "docReference" {
                    if let Some(props) = map.get("props").and_then(|p| p.as_object()) {
                        if let Some(serde_json::Value::String(doc_id)) = props.get("docId") {
                            if !doc_id.is_empty() {
                                doc_ids.insert(doc_id.clone());
                            }
                        }
                    }
                }
            }
            for v in map.values() {
                collect_doc_refs(v, doc_ids);
            }
        }
        serde_json::Value::Array(arr) => {
            for v in arr {
                collect_doc_refs(v, doc_ids);
            }
        }
        _ => {}
    }
}
