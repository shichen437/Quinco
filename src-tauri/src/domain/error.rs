use std::fmt;

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
        DomainError::NotFound(entity.into())
    }

    pub fn subject_not_found(subject: &'static str, entity: &'static str) -> Self {
        DomainError::SubjectNotFound { subject, entity }
    }

    pub fn locked() -> Self {
        DomainError::Locked { subject: None }
    }

    pub fn subject_locked(subject: &'static str) -> Self {
        DomainError::Locked {
            subject: Some(subject),
        }
    }

    pub fn validation(message: impl Into<String>) -> Self {
        DomainError::Validation(message.into())
    }

    pub fn infra(err: impl std::fmt::Display) -> Self {
        DomainError::Infra(err.to_string())
    }

    pub fn illegal_operation(message: impl Into<String>) -> Self {
        DomainError::IllegalOperation(message.into())
    }
}

impl fmt::Display for DomainError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            DomainError::NotFound(entity) => write!(f, "{} not found", entity),
            DomainError::SubjectNotFound { subject, entity } => {
                write!(f, "{} {} not found", subject, entity)
            }
            DomainError::Locked { subject } => match subject {
                Some(s) => write!(f, "{} is locked", s),
                None => write!(f, "document is locked"),
            },
            DomainError::Validation(msg) => write!(f, "{}", msg),
            DomainError::Infra(msg) => write!(f, "{}", msg),
            DomainError::IllegalOperation(msg) => write!(f, "illegal operation: {}", msg),
        }
    }
}

impl std::error::Error for DomainError {}

impl From<DomainError> for String {
    fn from(err: DomainError) -> Self {
        err.to_string()
    }
}
