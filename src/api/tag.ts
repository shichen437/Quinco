import { invoke } from "@tauri-apps/api/core"

export interface TagItem {
  id: number
  name: string
}

export async function listCurrentWorkspaceTags(): Promise<TagItem[]> {
  return invoke<TagItem[]>("tag_list_current_workspace")
}

export async function createTag(name: string): Promise<TagItem> {
  return invoke<TagItem>("tag_create_current_workspace", { name })
}

export async function updateTag(id: number, name: string): Promise<TagItem> {
  return invoke<TagItem>("tag_update_current_workspace", { id, name })
}

export async function deleteTag(id: number): Promise<void> {
  return invoke("tag_delete_current_workspace", { id })
}

export async function listDocTags(id: string): Promise<TagItem[]> {
  return invoke<TagItem[]>("doc_list_tags", { id })
}

export async function attachDocTag(id: string, tagId: number): Promise<void> {
  return invoke("doc_attach_tag", { id, tagId })
}

export async function detachDocTag(id: string, tagId: number): Promise<void> {
  return invoke("doc_detach_tag", { id, tagId })
}
