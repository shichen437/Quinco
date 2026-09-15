import { useMemo } from "react"

import { create } from "zustand"

import { getFavoriteDocuments, toggleFavoriteDocument } from "@/api/tauri-bridge/document"
import type { Document } from "@/api/tauri-bridge/document"

interface FavoritesState {
  favorites: Document[]
  loading: boolean
  error: string | null
  loadFavorites: () => Promise<void>
  toggleFavorite: (docId: string) => Promise<{ ok: boolean; isFavorite: boolean }>
  isFavorite: (docId: string) => boolean
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  loading: false,
  error: null,

  loadFavorites: async () => {
    set({ loading: true, error: null })
    try {
      const docs = await getFavoriteDocuments()
      set({ favorites: docs, loading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      set({ loading: false, error: message })
    }
  },

  toggleFavorite: async (docId: string) => {
    try {
      const newStatus = await toggleFavoriteDocument(docId)
      const isNowFavorite = newStatus === 1

      set((state) => {
        if (isNowFavorite) {
          get().loadFavorites()
          return state
        } else {
          return {
            favorites: state.favorites.filter((d) => d.id !== docId),
          }
        }
      })

      return { ok: true, isFavorite: isNowFavorite }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      set({ error: message })
      return { ok: false, isFavorite: false }
    }
  },

  isFavorite: (docId: string) => {
    return get().favorites.some((d) => d.id === docId)
  },
}))

/** Memoized Set of favorite document IDs — reference stays stable across re-renders. */
export function useFavoriteIds(): Set<string> {
  const favorites = useFavoritesStore((s) => s.favorites)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- favorites identity is the true dep
  return useMemo(() => new Set(favorites.map((d) => d.id)), [favorites])
}
