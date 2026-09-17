use uuid::Uuid;

use crate::domain::document::entity::{
    extract_doc_reference_ids, Document, GraphData, LinkChanges, NewDocument, UpdateDocContent,
};
use crate::domain::document::repo::DocumentRepository;
use crate::interfaces::dto::page::Paginated;
use crate::shared::error::DomainError;

pub struct DocumentUseCase<R: DocumentRepository> {
    repo: R,
}

impl<R: DocumentRepository> DocumentUseCase<R> {
    pub fn new(repo: R) -> Self {
        Self { repo }
    }

    pub async fn get_document(&self, id: &str) -> Result<Document, DomainError> {
        self.repo.get_by_id(id).await
    }

    pub async fn get_workspace_documents_paged(
        &self,
        wid: i64,
        page: i64,
        page_size: i64,
    ) -> Result<Paginated<Document>, DomainError> {
        let (items, total) = self
            .repo
            .get_by_workspace_paged(wid, page, page_size)
            .await?;
        Ok(Paginated::new(items, total, page, page_size))
    }

    pub async fn get_favorites(&self, wid: i64) -> Result<Vec<Document>, DomainError> {
        self.repo.get_favorites(wid).await
    }

    pub async fn toggle_favorite(&self, id: &str) -> Result<bool, DomainError> {
        let mut doc = self.repo.get_by_id(id).await?;
        let new_status = doc.toggle_favorite()?;
        self.repo.save(&doc).await?;
        Ok(new_status)
    }

    pub async fn get_deleted_paged(
        &self,
        wid: i64,
        page: i64,
        page_size: i64,
    ) -> Result<Paginated<Document>, DomainError> {
        let (items, total) = self.repo.get_deleted_paged(wid, page, page_size).await?;
        Ok(Paginated::new(items, total, page, page_size))
    }

    pub async fn get_recent_documents(
        &self,
        wid: i64,
        page_size: i64,
    ) -> Result<Vec<Document>, DomainError> {
        self.repo.get_recent_documents(wid, page_size).await
    }

    pub async fn doc_search(
        &self,
        wid: i64,
        keyword: &str,
        page_size: i64,
    ) -> Result<Vec<Document>, DomainError> {
        self.repo.doc_search(wid, keyword, page_size).await
    }

    pub async fn create_document(
        &self,
        wid: i64,
        title: Option<&str>,
    ) -> Result<Document, DomainError> {
        let doc_id = Uuid::new_v4().to_string();
        let new_doc = match title {
            Some(t) if !t.is_empty() => NewDocument::with_title(doc_id, wid, t),
            _ => NewDocument::new(doc_id, wid),
        };
        self.repo.create(new_doc).await
    }

    pub async fn update_title(&self, doc_id: &str, title: &str) -> Result<(), DomainError> {
        let mut doc = self.repo.get_by_id(doc_id).await?;
        doc.rename(title);
        self.repo.save(&doc).await
    }

    pub async fn update_content(
        &self,
        doc_id: &str,
        content: &str,
        plain_text: &str,
    ) -> Result<(), DomainError> {
        let new_refs: Vec<String> = extract_doc_reference_ids(content)
            .into_iter()
            .filter(|id| id != doc_id)
            .collect();
        let current_refs = self.repo.get_link_targets(doc_id).await?;
        let changes = LinkChanges::compute(&current_refs, &new_refs);

        let update = UpdateDocContent {
            doc_id: doc_id.to_string(),
            content: content.to_string(),
            plain_text: plain_text.to_string(),
        };
        self.repo.update_content(update, &changes).await
    }

    pub async fn get_content(
        &self,
        doc_id: &str,
    ) -> Result<crate::domain::document::entity::DocExt, DomainError> {
        self.repo.get_content(doc_id).await
    }

    pub async fn soft_delete(&self, id: &str) -> Result<(), DomainError> {
        let mut doc = self.repo.get_by_id_including_deleted(id).await?;
        if !doc.is_deleted() {
            doc.mark_deleted();
            self.repo.save(&doc).await?;
        }
        Ok(())
    }

    pub async fn restore(&self, id: &str) -> Result<(), DomainError> {
        let mut doc = self.repo.get_by_id_including_deleted(id).await?;
        if doc.is_deleted() {
            doc.restore();
            self.repo.save(&doc).await?;
        }
        Ok(())
    }

    pub async fn hard_delete(&self, id: &str) -> Result<(), DomainError> {
        self.repo.hard_delete(id).await
    }

    pub async fn empty_trash(&self, wid: i64) -> Result<(), DomainError> {
        self.repo.hard_delete_all_trashed(wid).await
    }

    pub async fn toggle_lock(&self, id: &str) -> Result<bool, DomainError> {
        let mut doc = self.repo.get_by_id(id).await?;
        let new_status = doc.toggle_lock()?;
        self.repo.save(&doc).await?;
        Ok(new_status)
    }

    pub async fn get_backlinks(&self, doc_id: &str) -> Result<Vec<Document>, DomainError> {
        self.repo.get_backlinks(doc_id).await
    }

    pub async fn get_graph_data(&self, wid: i64) -> Result<GraphData, DomainError> {
        let nodes = self.repo.get_all_including_deleted(wid).await?;
        let links = self.repo.get_all_links(wid).await?;
        Ok(GraphData { nodes, links })
    }
}
