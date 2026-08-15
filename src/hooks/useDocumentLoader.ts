import { useCallback, useEffect, useRef, useState } from "react"

import type { PartialBlock } from "@blocknote/core"

import { getDocWithContent } from "@/api/doc"
import { listDocTags, type TagItem } from "@/api/tag"

interface LoadState {
  title: string
  emoji: string
  initialBlocks: PartialBlock[]
  updatedAt: string
  createdAt: string
  isFavorite: boolean
  isLock: boolean
  isDelete: boolean
  tags: TagItem[]
  ready: boolean
}

const initialState: LoadState = {
  title: "未命名",
  emoji: "",
  initialBlocks: [],
  updatedAt: "",
  createdAt: "",
  isFavorite: false,
  isLock: false,
  isDelete: false,
  tags: [],
  ready: false,
}

export function useDocumentLoader(docId: string | undefined, waitForSave?: () => Promise<void>) {
  const [state, setState] = useState<LoadState>(initialState)
  const loadIdRef = useRef(0)
  const isMountedRef = useRef(true)

  const loadDocument = useCallback(
    async (id: string, loadId: number) => {
      if (waitForSave) {
        await waitForSave()
      }

      if (loadId !== loadIdRef.current || !isMountedRef.current) return

      setState((prev) => ({
        ...prev,
        ...initialState,
        ready: false,
      }))

      try {
        const [doc, tags] = await Promise.all([
          getDocWithContent(id),
          listDocTags(id).catch((err) => {
            console.error("加载文档标签失败", err)
            return [] as TagItem[]
          }),
        ])

        if (loadId !== loadIdRef.current || !isMountedRef.current) return

        let blocks: PartialBlock[] = []
        try {
          const parsed = JSON.parse(doc.content || "[]")
          blocks = Array.isArray(parsed) && parsed.length > 0 ? parsed : []
        } catch {
          blocks = []
        }

        setState({
          title: doc.title || "未命名",
          emoji: doc.emoji || "",
          initialBlocks: blocks,
          updatedAt: doc.updatedAt,
          createdAt: doc.createdAt,
          isFavorite: doc.isFavorite === 1,
          isLock: doc.isLock === 1,
          isDelete: doc.isDelete === 1,
          tags: tags,
          ready: true,
        })
      } catch (error) {
        console.error("加载文档失败", error)
        if (loadId === loadIdRef.current && isMountedRef.current) {
          setState((prev) => ({
            ...prev,
            ready: true,
            initialBlocks: [],
            title: "加载失败",
          }))
        }
      }
    },
    [waitForSave]
  )

  useEffect(() => {
    if (!docId) {
      setState(initialState)
      loadIdRef.current++
      return
    }

    const loadId = ++loadIdRef.current
    loadDocument(docId, loadId)

    return () => {
      loadIdRef.current++
    }
  }, [docId, loadDocument])

  const updateFavorite = useCallback((isFavorite: boolean) => {
    setState((prev) => ({ ...prev, isFavorite }))
  }, [])

  const updateLock = useCallback((isLock: boolean) => {
    setState((prev) => ({ ...prev, isLock }))
  }, [])

  const updateTitle = useCallback((title: string) => {
    setState((prev) => ({ ...prev, title }))
  }, [])

  const updateEmoji = useCallback((emoji: string) => {
    setState((prev) => ({ ...prev, emoji }))
  }, [])

  const updateTags = useCallback((tags: TagItem[]) => {
    setState((prev) => ({ ...prev, tags }))
  }, [])

  const updateUpdatedAt = useCallback((updatedAt: string) => {
    setState((prev) => ({ ...prev, updatedAt }))
  }, [])

  return {
    ...state,
    updateFavorite,
    updateLock,
    updateTitle,
    updateEmoji,
    updateTags,
    updateUpdatedAt,
    reset: () => setState(initialState),
  }
}
