import { useCallback, useEffect, useRef, useState } from "react"

import type { PartialBlock } from "@blocknote/core"
import { useTranslation } from "react-i18next"

import {
  getDocument,
  getDocumentContent,
  toggleLockDocument,
  updateDocumentContent,
  updateDocumentTitle,
} from "@/api/tauri-bridge/document"
import { useTabStore } from "@/stores/navigationStore"

import BlockNote from "./components/blocknote/BlockNote"
import EditorBiLinks from "./components/EditorBiLinks"
import EditorHeader from "./components/EditorHeader"
import EditorMetadata from "./components/EditorMetadata"
import EditorTitle from "./components/EditorTitle"

function EditorPage() {
  const { t } = useTranslation("common")
  const { t: tEditor } = useTranslation("editor")
  const activeTab = useTabStore((s) => s.tabs.find((t) => t.id === s.activeTabId))
  const updateTabTitle = useTabStore((s) => s.updateTabTitle)

  const docId = activeTab?.docId

  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(true)
  const [initialBlocks, setInitialBlocks] = useState<PartialBlock[] | undefined>(undefined)
  const [docCreatedAt, setDocCreatedAt] = useState<string | null>(null)
  const [docUpdatedAt, setDocUpdatedAt] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState(false)

  const titleSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!docId) {
      setLoading(false)
      setTitle("")
      setInitialBlocks(undefined)
      return
    }

    let cancelled = false

    async function loadDocument() {
      setLoading(true)
      try {
        const document = await getDocument(docId!)
        if (cancelled) return

        setTitle(document.title)
        setDocCreatedAt(document.created_at)
        setDocUpdatedAt(document.updated_at)
        setIsLocked(document.is_lock === 1)

        const state = useTabStore.getState()
        const currentTab = state.tabs.find((t) => t.id === state.activeTabId)
        if (currentTab) {
          updateTabTitle(currentTab.id, document.title || t("unnamed"))
        }

        const content = await getDocumentContent(docId!)
        if (cancelled) return

        if (content.content) {
          try {
            const blocks = JSON.parse(content.content) as PartialBlock[]
            setInitialBlocks(blocks)
          } catch {
            setInitialBlocks(undefined)
          }
        } else {
          setInitialBlocks(undefined)
        }
      } catch (err) {
        console.error("Failed to load document:", err)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadDocument()

    return () => {
      cancelled = true
    }
  }, [docId, updateTabTitle])

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle)

      const state = useTabStore.getState()
      const currentTab = state.tabs.find((t) => t.id === state.activeTabId)
      if (currentTab) {
        updateTabTitle(currentTab.id, newTitle || t("unnamed"))
      }

      if (titleSaveTimerRef.current) {
        clearTimeout(titleSaveTimerRef.current)
      }
      titleSaveTimerRef.current = setTimeout(async () => {
        if (docId) {
          try {
            await updateDocumentTitle(docId, newTitle)
          } catch (err) {
            console.error("Failed to update title:", err)
          }
        }
      }, 500)
    },
    [docId, updateTabTitle]
  )

  const handleContentChange = useCallback(
    (blocks: PartialBlock[]) => {
      if (contentSaveTimerRef.current) {
        clearTimeout(contentSaveTimerRef.current)
      }
      contentSaveTimerRef.current = setTimeout(async () => {
        if (docId) {
          try {
            const content = JSON.stringify(blocks)
            const plainText = blocks
              .map((block) => {
                if ("content" in block && Array.isArray(block.content)) {
                  return (block.content as Array<{ type: string; text?: string }>)
                    .map((ic) => ic.text || "")
                    .join("")
                }
                return ""
              })
              .join("\n")
            await updateDocumentContent(docId, content, plainText)
          } catch (err) {
            console.error("Failed to update content:", err)
          }
        }
      }, 500)
    },
    [docId]
  )

  const handleEditorReady = useCallback((_editor: unknown) => {}, [])

  useEffect(() => {
    return () => {
      if (titleSaveTimerRef.current) {
        clearTimeout(titleSaveTimerRef.current)
      }
      if (contentSaveTimerRef.current) {
        clearTimeout(contentSaveTimerRef.current)
      }
    }
  }, [])

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const editorEl = document.querySelector('[contenteditable="true"]') as HTMLElement | null
      editorEl?.focus()
    }
  }, [])

  if (!docId) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-muted-foreground text-sm">{tEditor("noDocPleaseCreate")}</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-muted-foreground text-sm">{t("loading")}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden max-w-4xl mx-auto w-full">
      <EditorHeader
        title={title}
        docId={docId}
        isLocked={isLocked}
        onToggleLock={async () => {
          try {
            const newStatus = await toggleLockDocument(docId!)
            setIsLocked(newStatus === 1)
          } catch (err) {
            console.error("Failed to toggle lock:", err)
          }
        }}
      />
      <EditorTitle
        title={title}
        onChange={handleTitleChange}
        onKeyDown={handleTitleKeyDown}
        disabled={isLocked}
      />
      <EditorMetadata docId={docId} createdAt={docCreatedAt} updatedAt={docUpdatedAt} />

      <main className="flex-1 overflow-y-auto min-h-100 w-full px-4 pb-1">
        <BlockNote
          initialBlocks={initialBlocks}
          onSave={handleContentChange}
          editable={!isLocked}
          docId={docId}
          onEditorReady={handleEditorReady}
        />
      </main>
      <EditorBiLinks docId={docId} />
    </div>
  )
}

export default EditorPage
