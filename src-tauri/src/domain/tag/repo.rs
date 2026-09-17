use async_trait::async_trait;

use crate::domain::tag::entity::{NewTag, Tag};
use crate::shared::error::DomainError;

#[async_trait]
pub trait TagRepository: Send + Sync {
    async fn get_by_workspace_paged(
        &self,
        wid: i64,
        page: i64,
        page_size: i64,
    ) -> Result<(Vec<Tag>, i64), DomainError>;

    async fn find_by_name(&self, wid: i64, name: &str) -> Result<Option<Tag>, DomainError>;

    async fn create_or_get(&self, tag: NewTag) -> Result<Tag, DomainError>;

    async fn get_by_doc(&self, doc_id: &str) -> Result<Vec<Tag>, DomainError>;

    async fn link_to_doc(&self, tid: i64, doc_id: &str) -> Result<(), DomainError>;

    async fn unlink_from_doc(&self, tid: i64, doc_id: &str) -> Result<(), DomainError>;

    #[allow(dead_code)]
    async fn get_doc_tag_ids(&self, doc_id: &str) -> Result<Vec<i64>, DomainError>;

    async fn update(&self, tid: i64, name: &str, color: &str) -> Result<Tag, DomainError>;

    async fn delete(&self, tid: i64) -> Result<(), DomainError>;

    async fn delete_all_in_workspace(&self, wid: i64) -> Result<(), DomainError>;

    async fn get_tag_doc_ids(&self, tid: i64) -> Result<Vec<String>, DomainError>;
}
