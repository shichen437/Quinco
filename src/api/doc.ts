import { invoke } from "@tauri-apps/api/core"

export interface DocListItem {
  id: string
  title: string
  emoji: string
  updatedAt: string
}

export interface DocDetail {
  id: string
  title: string
  emoji: string
  wid: number
  isLock: number
  isFavorite: number
  isDelete: number
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface DocWithContent extends DocDetail {
  content: string
}

export interface DocLinkItem {
  id: string
  title: string
  emoji: string
  isDelete: number
}

export interface DocBidirectionalLinks {
  reverseLinks: DocLinkItem[]
}

export interface GraphNode {
  id: string
  title: string
  emoji: string
  isDelete: number
}

export interface GraphEdge {
  source: string
  target: string
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface TrashDocItem {
  id: string
  title: string
  emoji: string
  deletedAt: string | null
}

export async function listCurrentWorkspaceDocs(): Promise<DocListItem[]> {
  return invoke<DocListItem[]>("doc_list_current_workspace")
}

export async function listDocsByTag(tagId: number): Promise<DocListItem[]> {
  return invoke<DocListItem[]>("doc_list_by_tag_current_workspace", { tagId })
}

export async function listFavoriteDocs(): Promise<DocListItem[]> {
  return invoke<DocListItem[]>("doc_list_favorite_current_workspace")
}

export async function quickSearchDocs(query: string, limit: number): Promise<DocListItem[]> {
  return invoke<DocListItem[]>("doc_quick_search", { query, limit })
}

export async function searchReferenceCandidates(
  query: string,
  limit: number,
  excludeId?: string
): Promise<DocListItem[]> {
  return invoke<DocListItem[]>("doc_search_reference_candidates", { query, limit, excludeId })
}

export async function getDoc(id: string): Promise<DocDetail> {
  return invoke<DocDetail>("doc_get", { id })
}

export async function getDocWithContent(id: string): Promise<DocWithContent> {
  return invoke<DocWithContent>("doc_get_with_content", { id })
}

export async function createDoc(): Promise<DocDetail> {
  return invoke<DocDetail>("doc_create_current_workspace")
}

export async function updateDocTitle(id: string, title: string): Promise<DocDetail> {
  return invoke<DocDetail>("doc_update_title", { id, title })
}

export async function updateDocEmoji(id: string, emoji: string): Promise<DocDetail> {
  return invoke<DocDetail>("doc_update_emoji", { id, emoji })
}

export async function updateDocContent(
  id: string,
  content: string,
  plainText: string
): Promise<void> {
  return invoke("doc_update_content", { id, content, plainText })
}

export async function setDocFavorite(id: string, isFavorite: number): Promise<DocDetail> {
  return invoke<DocDetail>("doc_set_favorite", { id, isFavorite })
}

export async function setDocLock(id: string, isLock: number): Promise<DocDetail> {
  return invoke<DocDetail>("doc_set_lock", { id, isLock })
}

export async function moveDocToTrash(id: string): Promise<void> {
  return invoke("doc_move_to_trash", { id })
}

export async function listTrashDocs(): Promise<TrashDocItem[]> {
  return invoke<TrashDocItem[]>("doc_list_trash_current_workspace")
}

export async function restoreDocFromTrash(id: string): Promise<void> {
  return invoke("doc_restore_from_trash", { id })
}

export async function deleteDocPermanently(id: string): Promise<void> {
  return invoke("doc_delete_permanently", { id })
}

export async function listBidirectionalLinks(id: string): Promise<DocBidirectionalLinks> {
  return invoke<DocBidirectionalLinks>("doc_list_bidirectional_links", { id })
}

export async function getGraphData(): Promise<GraphData> {
  return invoke<GraphData>("doc_graph_data")
}
