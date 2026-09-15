use async_trait::async_trait;

use crate::domain::workspace::entity::{NewWorkspace, Workspace};
use crate::shared::error::DomainError;

#[async_trait]
pub trait WorkspaceRepository: Send + Sync {
    async fn get_all(&self) -> Result<Vec<Workspace>, DomainError>;

    async fn get_current(&self) -> Result<Workspace, DomainError>;

    async fn get_by_id(&self, id: i64) -> Result<Workspace, DomainError>;

    async fn create(&self, workspace: NewWorkspace) -> Result<Workspace, DomainError>;

    async fn switch_to(&self, id: i64) -> Result<Workspace, DomainError>;

    async fn delete(&self, id: i64) -> Result<(), DomainError>;

    #[allow(dead_code)]
    async fn exists(&self) -> Result<bool, DomainError>;

    async fn update_name(&self, id: i64, name: &str) -> Result<Workspace, DomainError>;

    async fn find_first_demo(&self) -> Result<Option<Workspace>, DomainError>;

    async fn reset_workspace(&self, id: i64) -> Result<Workspace, DomainError>;
}
