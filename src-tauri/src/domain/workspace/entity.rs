use chrono::NaiveDateTime;

use crate::shared::error::DomainError;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WorkspaceType {
    Local,
    Demo,
}

impl Default for WorkspaceType {
    fn default() -> Self {
        WorkspaceType::Local
    }
}

impl WorkspaceType {
    pub fn as_str(&self) -> &'static str {
        match self {
            WorkspaceType::Local => "local",
            WorkspaceType::Demo => "demo",
        }
    }

    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "local" => Some(WorkspaceType::Local),
            "demo" => Some(WorkspaceType::Demo),
            _ => None,
        }
    }

    pub fn parse_or_default(s: &str) -> Self {
        Self::parse(s).unwrap_or_default()
    }

    pub fn is_demo(&self) -> bool {
        matches!(self, WorkspaceType::Demo)
    }
}

#[derive(Debug, Clone)]
pub struct Workspace {
    pub id: i64,
    pub name: String,
    is_current: bool,
    pub r#type: WorkspaceType,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

impl Workspace {
    pub(crate) fn from_parts(
        id: i64,
        name: String,
        is_current: bool,
        r#type: WorkspaceType,
        created_at: Option<NaiveDateTime>,
        updated_at: Option<NaiveDateTime>,
    ) -> Self {
        Self {
            id,
            name,
            is_current,
            r#type,
            created_at,
            updated_at,
        }
    }

    pub fn ensure_valid_name(name: &str) -> Result<(), DomainError> {
        if name.trim().is_empty() {
            return Err(DomainError::validation("Workspace name cannot be empty"));
        }
        Ok(())
    }

    pub fn can_delete(&self) -> bool {
        !self.r#type.is_demo()
    }

    pub fn is_current(&self) -> bool {
        self.is_current
    }
}

#[derive(Debug, Clone)]
pub struct NewWorkspace {
    name: String,
    r#type: WorkspaceType,
}

impl NewWorkspace {
    pub fn new(name: impl Into<String>) -> Result<Self, DomainError> {
        let name = name.into();
        Workspace::ensure_valid_name(&name)?;
        Ok(Self {
            name,
            r#type: WorkspaceType::Local,
        })
    }

    #[allow(dead_code)]
    pub fn with_type(name: impl Into<String>, r#type: WorkspaceType) -> Result<Self, DomainError> {
        let name = name.into();
        Workspace::ensure_valid_name(&name)?;
        Ok(Self { name, r#type })
    }

    pub fn name(&self) -> &str {
        &self.name
    }

    pub fn r#type(&self) -> WorkspaceType {
        self.r#type
    }
}
