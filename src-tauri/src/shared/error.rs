use std::fmt;

use serde::Serialize;

pub mod code {
    pub const NOT_FOUND: &str = "NOT_FOUND";
    pub const LOCKED: &str = "LOCKED";
    pub const INVALID_ARGUMENT: &str = "INVALID_ARGUMENT";
    pub const FORBIDDEN: &str = "FORBIDDEN";
    pub const INTERNAL_ERROR: &str = "INTERNAL_ERROR";
}

const INTERNAL_ERROR_JSON: &str = r#"{"code":"INTERNAL_ERROR","message":"Internal server error"}"#;

#[derive(Debug, Clone, Serialize)]
pub struct ApiError {
    pub code: &'static str,
    pub message: String,
}

impl ApiError {
    pub fn to_json_string(&self) -> String {
        serde_json::to_string(self).unwrap_or_else(|_| INTERNAL_ERROR_JSON.to_string())
    }
}

#[derive(Debug)]
pub enum DomainError {
    NotFound(String),
    SubjectNotFound {
        subject: &'static str,
        entity: &'static str,
    },
    Locked {
        subject: Option<&'static str>,
    },
    Validation(String),
    Infra(String),
    IllegalOperation(String),
}

impl DomainError {
    pub fn not_found(entity: impl Into<String>) -> Self {
        Self::NotFound(entity.into())
    }

    pub fn subject_not_found(subject: &'static str, entity: &'static str) -> Self {
        Self::SubjectNotFound { subject, entity }
    }

    pub fn locked() -> Self {
        Self::Locked { subject: None }
    }

    pub fn subject_locked(subject: &'static str) -> Self {
        Self::Locked {
            subject: Some(subject),
        }
    }

    pub fn validation(message: impl Into<String>) -> Self {
        Self::Validation(message.into())
    }

    pub fn infra(err: impl std::error::Error + 'static) -> Self {
        Self::Infra(err.to_string())
    }

    pub fn illegal_operation(message: impl Into<String>) -> Self {
        Self::IllegalOperation(message.into())
    }

    pub fn into_api_json(self) -> String {
        if let Self::Infra(detail) = &self {
            tracing::error!(error = %detail, "infrastructure error occurred");
        }
        ApiError::from(self).to_json_string()
    }
}

impl fmt::Display for DomainError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::NotFound(entity) => write!(f, "{entity} not found"),
            Self::SubjectNotFound { subject, entity } => {
                write!(f, "{subject} {entity} not found")
            }
            Self::Locked { subject } => match subject {
                Some(s) => write!(f, "{s} is locked"),
                None => write!(f, "document is locked"),
            },
            Self::Validation(msg) | Self::Infra(msg) => f.write_str(msg),
            Self::IllegalOperation(msg) => write!(f, "illegal operation: {msg}"),
        }
    }
}

impl std::error::Error for DomainError {}

impl From<DomainError> for ApiError {
    fn from(err: DomainError) -> Self {
        match err {
            DomainError::NotFound(entity) => ApiError {
                code: code::NOT_FOUND,
                message: format!("{entity} not found"),
            },
            DomainError::SubjectNotFound { subject, entity } => ApiError {
                code: code::NOT_FOUND,
                message: format!("{subject} {entity} not found"),
            },
            DomainError::Locked { subject } => ApiError {
                code: code::LOCKED,
                message: match subject {
                    Some(s) => format!("{s} is locked"),
                    None => "Document is locked".to_string(),
                },
            },
            DomainError::Validation(msg) => ApiError {
                code: code::INVALID_ARGUMENT,
                message: msg,
            },
            DomainError::Infra(_) => ApiError {
                code: code::INTERNAL_ERROR,
                message: "Internal server error".to_string(),
            },
            DomainError::IllegalOperation(msg) => ApiError {
                code: code::FORBIDDEN,
                message: msg,
            },
        }
    }
}

impl From<DomainError> for String {
    fn from(err: DomainError) -> Self {
        err.into_api_json()
    }
}
