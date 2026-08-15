import { create } from "zustand"

import { listFavoriteDocs, type DocListItem } from "@/api/doc"

interface FavoriteState {
  favorites: DocListItem[]
  loadFavorites: () => Promise<void>
  addFavorite: (doc: DocListItem) => void
  removeFavorite: (id: string) => void
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favorites: [],

  loadFavorites: async () => {
    try {
      const list = await listFavoriteDocs()
      set({ favorites: list })
    } catch (err) {
      console.error("加载收藏列表失败", err)
    }
  },

  addFavorite: (doc) => {
    const { favorites } = get()
    if (favorites.some((d) => d.id === doc.id)) return
    set({ favorites: [doc, ...favorites] })
  },

  removeFavorite: (id) => {
    set({ favorites: get().favorites.filter((d) => d.id !== id) })
  },
}))
