use chrono::NaiveDateTime;

#[derive(Debug, Clone)]
pub struct Tag {
    pub id: i64,
    pub name: String,
    pub color: String,
    pub wid: i64,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone)]
pub struct NewTag {
    pub name: String,
    pub color: String,
    pub wid: i64,
}

impl NewTag {
    pub fn new(name: impl Into<String>, color: impl Into<String>, wid: i64) -> Self {
        Self {
            name: name.into(),
            color: color.into(),
            wid,
        }
    }
}
