use crate::domain::tag::entity::NewTag;
use crate::domain::tag::repo::TagRepository;
use crate::interfaces::dto::page::Paginated;
use crate::shared::error::DomainError;

pub struct TagUseCase<R: TagRepository> {
    repo: R,
}

impl<R: TagRepository> TagUseCase<R> {
    pub fn new(repo: R) -> Self {
        Self { repo }
    }

    pub async fn get_workspace_tags_paged(
        &self,
        wid: i64,
        page: i64,
        page_size: i64,
    ) -> Result<Paginated<crate::domain::tag::entity::Tag>, DomainError> {
        let (items, total) = self
            .repo
            .get_by_workspace_paged(wid, page, page_size)
            .await?;
        Ok(Paginated::new(items, total, page, page_size))
    }

    pub async fn get_doc_tags(
        &self,
        doc_id: &str,
    ) -> Result<Vec<crate::domain::tag::entity::Tag>, DomainError> {
        self.repo.get_by_doc(doc_id).await
    }

    pub async fn add_tag_to_doc(
        &self,
        wid: i64,
        doc_id: &str,
        tag_name: &str,
        color: &str,
    ) -> Result<crate::domain::tag::entity::Tag, DomainError> {
        let new_tag = NewTag::new(tag_name.trim(), color, wid);
        let tag = self.repo.create_or_get(new_tag).await?;
        self.repo.link_to_doc(tag.id, doc_id).await?;
        Ok(tag)
    }

    pub async fn remove_tag_from_doc(&self, doc_id: &str, tid: i64) -> Result<(), DomainError> {
        self.repo.unlink_from_doc(tid, doc_id).await
    }

    pub async fn update_tag(
        &self,
        tid: i64,
        tag_name: &str,
        color: &str,
    ) -> Result<Tag, DomainError> {
        self.repo.update(tid, tag_name.trim(), color).await
    }

    pub async fn delete_tag(&self, tid: i64) -> Result<(), DomainError> {
        self.repo.delete(tid).await
    }

    pub async fn get_tag_doc_ids(&self, tid: i64) -> Result<Vec<String>, DomainError> {
        self.repo.get_tag_doc_ids(tid).await
    }
}

pub use crate::domain::tag::entity::Tag;
