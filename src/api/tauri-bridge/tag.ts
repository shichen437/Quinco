import type { Paginated } from "./document"
import { call, callWithWorkspace } from "./helper"

export interface TagDTO {
  id: number
  name: string
  color: string
  wid: number
  created_at: string | null
  updated_at: string | null
}

export async function getWorkspaceTags(page = 1, pageSize = 20): Promise<Paginated<TagDTO>> {
  return callWithWorkspace<Paginated<TagDTO>>("get_workspace_tags", {
    page,
    pageSize,
  })
}

export async function getDocTags(docId: string): Promise<TagDTO[]> {
  return call<TagDTO[]>("get_doc_tags", { docId })
}

export async function addTagToDoc(docId: string, tagName: string, color: string): Promise<TagDTO> {
  return callWithWorkspace<TagDTO>("add_tag_to_doc", { docId, tagName, color })
}

export async function removeTagFromDoc(docId: string, tid: number): Promise<void> {
  return call<void>("remove_tag_from_doc", { docId, tid })
}

export async function updateTag(tid: number, tagName: string, color: string): Promise<TagDTO> {
  return call<TagDTO>("update_tag", { tid, tagName, color })
}

export async function deleteTag(tid: number): Promise<void> {
  return call<void>("delete_tag", { tid })
}

export async function getTagDocs(tid: number): Promise<string[]> {
  return call<string[]>("get_tag_docs", { tid })
}
