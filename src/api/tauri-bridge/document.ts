import { call, callWithWorkspace } from "./helper"

export const DEFAULT_PAGE_SIZE = 20

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export interface Document {
  id: string
  title: string
  emoji: string
  type: string
  wid: number
  is_lock: number
  is_favorite: number
  is_delete: number
  deleted_at: string | null
  created_at: string | null
  updated_at: string | null
}

export interface DocExt {
  id: number
  doc_id: string
  content: string | null
  plain_text: string | null
  created_at: string | null
  updated_at: string | null
}

export async function createDocument(title?: string): Promise<Document> {
  return callWithWorkspace<Document>("create_document", { title: title ?? null })
}

export async function getDocument(id: string): Promise<Document> {
  return call<Document>("get_document", { id })
}

export async function getDocumentContent(docId: string): Promise<DocExt> {
  return call<DocExt>("get_document_content", { docId })
}

export async function updateDocumentTitle(docId: string, title: string): Promise<void> {
  return call<void>("update_document_title", { docId, title })
}

export async function updateDocumentContent(
  docId: string,
  content: string,
  plainText: string
): Promise<void> {
  return call<void>("update_document_content", { docId, content, plainText })
}

export async function softDeleteDocument(id: string): Promise<void> {
  return call<void>("soft_delete_document", { id })
}

export async function restoreDocument(id: string): Promise<void> {
  return call<void>("restore_document", { id })
}

export async function hardDeleteDocument(id: string): Promise<void> {
  return call<void>("hard_delete_document", { id })
}

export async function emptyTrash(): Promise<void> {
  return callWithWorkspace<void>("empty_trash")
}

export async function toggleFavoriteDocument(id: string): Promise<number> {
  return call<number>("toggle_favorite_document", { id })
}

export async function toggleLockDocument(id: string): Promise<number> {
  return call<number>("toggle_lock_document", { id })
}

export async function getBacklinks(docId: string): Promise<Document[]> {
  return call<Document[]>("get_backlinks", { docId })
}

export async function getWorkspaceDocuments(
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<Paginated<Document>> {
  return callWithWorkspace<Paginated<Document>>("get_workspace_documents", {
    page,
    pageSize,
  })
}

export async function getFavoriteDocuments(): Promise<Document[]> {
  return callWithWorkspace<Document[]>("get_favorite_documents")
}

export async function getDeletedDocuments(
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<Paginated<Document>> {
  return callWithWorkspace<Paginated<Document>>("get_deleted_documents", {
    page,
    pageSize,
  })
}

export async function getRecentDocuments(pageSize: number): Promise<Document[]> {
  return callWithWorkspace<Document[]>("get_recent_documents", { pageSize })
}

export async function docSearch(keyword: string, pageSize: number): Promise<Document[]> {
  return callWithWorkspace<Document[]>("doc_search", { keyword, pageSize })
}
