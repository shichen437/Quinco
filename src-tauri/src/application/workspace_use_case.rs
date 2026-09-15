use crate::domain::ai::repo::AiSessionRepository;
use crate::domain::document::repo::DocumentRepository;
use crate::domain::tag::repo::TagRepository;
use crate::domain::workspace::entity::{NewWorkspace, Workspace};
use crate::domain::workspace::repo::WorkspaceRepository;
use crate::shared::error::DomainError;

pub struct WorkspaceUseCase<W, D, T, A> {
    workspace_repo: W,
    doc_repo: D,
    tag_repo: T,
    ai_repo: A,
}

impl<W, D, T, A> WorkspaceUseCase<W, D, T, A>
where
    W: WorkspaceRepository,
    D: DocumentRepository,
    T: TagRepository,
    A: AiSessionRepository,
{
    pub fn new(workspace_repo: W, doc_repo: D, tag_repo: T, ai_repo: A) -> Self {
        Self {
            workspace_repo,
            doc_repo,
            tag_repo,
            ai_repo,
        }
    }

    pub async fn get_all_workspaces(&self) -> Result<Vec<Workspace>, DomainError> {
        self.workspace_repo.get_all().await
    }

    pub async fn get_current_workspace(&self) -> Result<Workspace, DomainError> {
        self.workspace_repo.get_current().await
    }

    pub async fn switch_workspace(&self, id: i64) -> Result<Workspace, DomainError> {
        let ws = self.workspace_repo.get_by_id(id).await?;
        if ws.is_current() {
            return Ok(ws);
        }
        self.workspace_repo.switch_to(id).await
    }

    pub async fn create_workspace(
        &self,
        name: impl Into<String>,
    ) -> Result<Workspace, DomainError> {
        let new_ws = NewWorkspace::new(name)?;
        self.workspace_repo.create(new_ws).await
    }

    pub async fn create_and_switch_workspace(
        &self,
        name: impl Into<String>,
    ) -> Result<Workspace, DomainError> {
        let new_ws = NewWorkspace::new(name)?;
        let ws = self.workspace_repo.create(new_ws).await?;
        self.workspace_repo.switch_to(ws.id).await
    }

    pub async fn delete_workspace(&self, id: i64) -> Result<Workspace, DomainError> {
        let ws = self.workspace_repo.get_by_id(id).await?;
        if !ws.can_delete() {
            return Err(DomainError::illegal_operation(
                "Cannot delete demo workspace",
            ));
        }
        self.reset_workspace_data(id).await?;
        self.workspace_repo.delete(id).await?;
        let demo = self
            .workspace_repo
            .find_first_demo()
            .await?
            .ok_or_else(|| DomainError::not_found("No demo workspace available"))?;
        self.workspace_repo.switch_to(demo.id).await
    }

    pub async fn rename_workspace(
        &self,
        id: i64,
        name: impl Into<String>,
    ) -> Result<Workspace, DomainError> {
        let name = name.into();
        Workspace::ensure_valid_name(&name)?;
        self.workspace_repo.update_name(id, &name).await
    }

    pub async fn reset_workspace(&self, id: i64) -> Result<Workspace, DomainError> {
        self.reset_workspace_data(id).await?;
        self.workspace_repo.reset_workspace(id).await
    }

    async fn reset_workspace_data(&self, id: i64) -> Result<(), DomainError> {
        self.doc_repo.hard_delete_all_by_workspace(id).await?;
        self.tag_repo.delete_all_in_workspace(id).await?;
        self.ai_repo.delete_all_by_workspace(id).await?;
        Ok(())
    }
}
