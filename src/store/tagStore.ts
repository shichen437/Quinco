import { create } from "zustand"

import {
  createTag as createTagApi,
  deleteTag as deleteTagApi,
  listCurrentWorkspaceTags,
  updateTag as updateTagApi,
  type TagItem,
} from "@/api/tag"

interface TagState {
  tags: TagItem[]
  loadTags: () => Promise<void>
  createTag: (name: string) => Promise<TagItem | null>
  updateTag: (id: number, name: string) => Promise<TagItem | null>
  deleteTag: (id: number) => Promise<boolean>
}

export const useTagStore = create<TagState>((set, get) => ({
  tags: [],

  loadTags: async () => {
    try {
      const list = await listCurrentWorkspaceTags()
      set({ tags: list })
    } catch (err) {
      console.error("加载标签列表失败", err)
    }
  },

  createTag: async (name) => {
    try {
      const tag = await createTagApi(name)
      const { tags } = get()
      if (!tags.some((t) => t.id === tag.id)) {
        set({ tags: [...tags, tag] })
      }
      return tag
    } catch (err) {
      console.error("创建标签失败", err)
      return null
    }
  },

  updateTag: async (id, name) => {
    try {
      const tag = await updateTagApi(id, name)
      set({ tags: get().tags.map((t) => (t.id === id ? tag : t)) })
      return tag
    } catch (err) {
      console.error("更新标签失败", err)
      return null
    }
  },

  deleteTag: async (id) => {
    try {
      await deleteTagApi(id)
      set({ tags: get().tags.filter((t) => t.id !== id) })
      return true
    } catch (err) {
      console.error("删除标签失败", err)
      return false
    }
  },
}))
