use async_trait::async_trait;

use crate::domain::document::entity::{
    DocExt, DocLink, Document, LinkChanges, NewDocument, UpdateDocContent,
};
use crate::shared::error::DomainError;

#[async_trait]
pub trait DocumentRepository: Send + Sync {
    async fn get_by_id(&self, id: &str) -> Result<Document, DomainError>;

    async fn get_by_id_including_deleted(&self, id: &str) -> Result<Document, DomainError>;

    async fn get_by_workspace_paged(
        &self,
        wid: i64,
        page: i64,
        page_size: i64,
    ) -> Result<(Vec<Document>, i64), DomainError>;

    async fn get_favorites(&self, wid: i64) -> Result<Vec<Document>, DomainError>;

    async fn get_deleted_paged(
        &self,
        wid: i64,
        page: i64,
        page_size: i64,
    ) -> Result<(Vec<Document>, i64), DomainError>;

    async fn get_recent_documents(
        &self,
        wid: i64,
        page_size: i64,
    ) -> Result<Vec<Document>, DomainError>;

    async fn doc_search(
        &self,
        wid: i64,
        keyword: &str,
        page_size: i64,
    ) -> Result<Vec<Document>, DomainError>;

    async fn create(&self, doc: NewDocument) -> Result<Document, DomainError>;

    async fn update_content(
        &self,
        update: UpdateDocContent,
        changes: &LinkChanges,
    ) -> Result<(), DomainError>;

    async fn get_content(&self, doc_id: &str) -> Result<DocExt, DomainError>;

    async fn get_link_targets(&self, doc_id: &str) -> Result<Vec<String>, DomainError>;

    async fn save(&self, doc: &Document) -> Result<(), DomainError>;

    async fn hard_delete(&self, id: &str) -> Result<(), DomainError>;

    async fn hard_delete_all_by_workspace(&self, wid: i64) -> Result<(), DomainError>;

    async fn hard_delete_all_trashed(&self, wid: i64) -> Result<(), DomainError>;

    async fn get_backlinks(&self, doc_id: &str) -> Result<Vec<Document>, DomainError>;

    async fn get_all_links(&self, wid: i64) -> Result<Vec<DocLink>, DomainError>;

    async fn get_all_including_deleted(&self, wid: i64) -> Result<Vec<Document>, DomainError>;
}
