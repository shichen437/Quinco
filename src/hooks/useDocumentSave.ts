import { useCallback, useEffect, useRef } from "react"

import type { PartialBlock } from "@blocknote/core"
import { debounce } from "lodash"

import { updateDocContent } from "@/api/doc"

interface SaveState {
  docId: string
  content: string
  plainText: string
  version: number
}

export function useDocumentSave(docId: string | undefined) {
  const saveVersionRef = useRef(0)
  const pendingSaveRef = useRef<SaveState | null>(null)
  const isSavingRef = useRef(false)
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedVersionRef = useRef(0)

  const performSave = useCallback(async (state: SaveState) => {
    if (state.version !== saveVersionRef.current) {
      return
    }

    isSavingRef.current = true
    try {
      await updateDocContent(state.docId, state.content, state.plainText)
      lastSavedVersionRef.current = state.version
    } catch (error) {
      console.error("保存失败", error)
    } finally {
      isSavingRef.current = false
      if (pendingSaveRef.current && pendingSaveRef.current.version > lastSavedVersionRef.current) {
        performSave(pendingSaveRef.current)
        pendingSaveRef.current = null
      }
    }
  }, [])

  const debouncedSave = useCallback(
    debounce((state: SaveState) => {
      if (isSavingRef.current) {
        pendingSaveRef.current = state
        return
      }

      if (state.version !== saveVersionRef.current) {
        return
      }

      performSave(state)
    }, 800),
    [performSave]
  )

  const flushSave = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }

    debouncedSave.cancel()

    if (pendingSaveRef.current) {
      const state = pendingSaveRef.current
      pendingSaveRef.current = null
      await performSave(state)
    }

    if (isSavingRef.current) {
      await new Promise<void>((resolve) => {
        const check = setInterval(() => {
          if (!isSavingRef.current) {
            clearInterval(check)
            resolve()
          }
        }, 100)
      })
    }
  }, [debouncedSave, performSave])

  const saveContent = useCallback(
    (blocks: PartialBlock[]) => {
      if (!docId) return

      const version = ++saveVersionRef.current

      const blocksCopy = structuredClone(blocks)
      const content = JSON.stringify(blocksCopy)
      const plainText = blocksCopy
        .map((b: any) => {
          if (Array.isArray(b.content)) {
            return b.content.map((c: any) => c.text || "").join("")
          }
          return ""
        })
        .join("\n")

      const state: SaveState = {
        docId,
        content,
        plainText,
        version,
      }

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }

      if (pendingSaveRef.current && pendingSaveRef.current.docId === docId) {
        pendingSaveRef.current = state
      } else {
        pendingSaveRef.current = state
      }

      saveTimerRef.current = setTimeout(() => {
        saveTimerRef.current = null
        if (pendingSaveRef.current) {
          const toSave = pendingSaveRef.current
          pendingSaveRef.current = null
          debouncedSave(toSave)
        }
      }, 800)
    },
    [docId, debouncedSave]
  )

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
      debouncedSave.cancel()
    }
  }, [debouncedSave])

  const waitForSave = useCallback(async () => {
    await flushSave()
  }, [flushSave])

  return {
    saveContent,
    flushSave,
    waitForSave,
    getVersion: () => saveVersionRef.current,
    getLastSavedVersion: () => lastSavedVersionRef.current,
  }
}
