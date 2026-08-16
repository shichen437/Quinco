import { useCallback, useMemo } from "react"

import type { PartialBlock } from "@blocknote/core"
import { useTranslation } from "react-i18next"

import {
  deleteDocPermanently,
  moveDocToTrash,
  restoreDocFromTrash,
  setDocFavorite,
  setDocLock,
  updateDocEmoji,
  updateDocTitle,
} from "@/api/doc"
import { attachDocTag, detachDocTag, type TagItem } from "@/api/tag"
import BlockNote from "@/components/blockNote/BlockNote"
import { toast } from "@/components/ui/toast"
import { useDocumentLoader } from "@/hooks/useDocumentLoader"
import { useDocumentSave } from "@/hooks/useDocumentSave"
import { useFavoriteStore } from "@/store/favoriteStore"
import { useTabStore } from "@/store/tabStore"

import EditorBacklinks from "./components/EditorBacklinks"
import EditorInfo from "./components/EditorInfo"
import EditorTitle from "./components/EditorTitle"
import EditorTitleBar from "./components/EditorTitleBar"

function EditorPage() {
  const { t } = useTranslation("sidebar")
  const { tabs, activeTabId, openTab } = useTabStore()
  const addFavorite = useFavoriteStore((s) => s.addFavorite)
  const removeFavorite = useFavoriteStore((s) => s.removeFavorite)

  const activeTab = useMemo(() => tabs.find((t) => t.id === activeTabId), [tabs, activeTabId])
  const docId = activeTab?.docId

  const { saveContent, flushSave } = useDocumentSave(docId)
  const {
    title,
    emoji,
    initialBlocks,
    updatedAt,
    createdAt,
    isFavorite,
    isLock,
    isDelete,
    tags,
    ready,
    updateFavorite,
    updateLock,
    updateTitle,
    updateEmoji,
    updateTags,
    updateUpdatedAt,
  } = useDocumentLoader(docId, flushSave)

  const handleToggleFavorite = useCallback(async () => {
    if (!docId) return
    const newValue = isFavorite ? 0 : 1
    const doc = await setDocFavorite(docId, newValue)
    const newFavoriteState = doc.isFavorite === 1
    updateFavorite(newFavoriteState)

    if (newFavoriteState) {
      addFavorite({ id: doc.id, title: doc.title, emoji: doc.emoji, updatedAt: doc.updatedAt })
    } else {
      removeFavorite(doc.id)
    }
  }, [docId, isFavorite, addFavorite, removeFavorite, updateFavorite])

  const handleToggleLock = useCallback(async () => {
    if (!docId) return
    const newValue = isLock ? 0 : 1
    const doc = await setDocLock(docId, newValue)
    updateLock(doc.isLock === 1)
  }, [docId, isLock, updateLock])

  const handleTitleUpdate = useCallback(
    async (newTitle: string) => {
      if (!docId) return
      try {
        const doc = await updateDocTitle(docId, newTitle)
        updateTitle(doc.title)
        if (doc.updatedAt) {
          updateUpdatedAt(doc.updatedAt)
        }
      } catch (error) {
        toast.add({
          title: t("common:operationFailed"),
          description: t("common:operationFailed"),
          type: "error",
        })
      }
    },
    [docId, updateTitle, updateUpdatedAt]
  )

  const handleEmojiUpdate = useCallback(
    async (newEmoji: string) => {
      if (!docId) return
      try {
        const doc = await updateDocEmoji(docId, newEmoji)
        updateEmoji(doc.emoji)
        if (doc.updatedAt) {
          updateUpdatedAt(doc.updatedAt)
        }
      } catch (error) {
        console.error("更新 emoji 失败", error)
        toast.add({
          title: t("common:operationFailed"),
          description: t("common:operationFailed"),
          type: "error",
        })
      }
    },
    [docId, updateEmoji, updateUpdatedAt]
  )

  const handleMoveToTrash = useCallback(async () => {
    if (!docId) return
    await flushSave()
    await moveDocToTrash(docId)
    if (isFavorite) {
      removeFavorite(docId)
    }
  }, [docId, isFavorite, removeFavorite, flushSave])

  const handleTrashConfirmed = useCallback(() => {
    openTab({ type: "all-docs", title: t("allDocs") })
  }, [openTab, t])

  const handleRestore = useCallback(async () => {
    if (!docId) return
    await restoreDocFromTrash(docId)
  }, [docId])

  const handleRestoreConfirmed = useCallback(() => {
    openTab({ type: "all-docs", title: t("allDocs") })
  }, [openTab, t])

  const handleDeletePermanently = useCallback(async () => {
    if (!docId) return
    await flushSave()
    await deleteDocPermanently(docId)
    if (isFavorite) {
      removeFavorite(docId)
    }
  }, [docId, isFavorite, removeFavorite, flushSave])

  const handleAttachTag = useCallback(
    async (tag: TagItem) => {
      if (!docId) return
      await attachDocTag(docId, tag.id)
      if (!tags.some((t) => t.id === tag.id)) {
        updateTags([...tags, tag])
      }
    },
    [docId, tags, updateTags]
  )

  const handleDetachTag = useCallback(
    async (tagId: number) => {
      if (!docId) return
      await detachDocTag(docId, tagId)
      updateTags(tags.filter((t) => t.id !== tagId))
    },
    [docId, tags, updateTags]
  )

  const handleContentChange = useCallback(
    (blocks: PartialBlock[]) => {
      saveContent(blocks)
    },
    [saveContent]
  )

  return (
    <div className="flex h-full w-full flex-col">
      <EditorTitleBar
        title={title}
        isFavorite={isFavorite}
        isLock={isLock}
        isDelete={isDelete}
        onToggleFavorite={handleToggleFavorite}
        onToggleLock={handleToggleLock}
        onMoveToTrash={handleMoveToTrash}
        onTrashConfirmed={handleTrashConfirmed}
        onRestore={handleRestore}
        onRestoreConfirmed={handleRestoreConfirmed}
        onDeletePermanently={handleDeletePermanently}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-7">
          <EditorTitle
            title={title}
            emoji={emoji}
            isLock={isLock}
            isDelete={isDelete}
            onTitleUpdate={handleTitleUpdate}
            onEmojiUpdate={handleEmojiUpdate}
          />
        </div>

        <div className="mx-auto max-w-3xl px-8">
          <EditorInfo
            updatedAt={updatedAt}
            createdAt={createdAt}
            tags={tags}
            isLock={isLock}
            isDelete={isDelete}
            onAttachTag={handleAttachTag}
            onDetachTag={handleDetachTag}
          />
        </div>

        <div className="mx-auto max-w-3xl min-h-75">
          {ready && (
            <BlockNote
              key={docId}
              docId={docId}
              initialBlocks={initialBlocks}
              onSave={handleContentChange}
              editable={!isLock && !isDelete}
            />
          )}
        </div>
      </div>

      <div>
        <div className="mx-auto max-w-3xl px-8">{docId && <EditorBacklinks docId={docId} />}</div>
      </div>
    </div>
  )
}

export default EditorPage
