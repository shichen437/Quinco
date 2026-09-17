import { useState } from "react"

import { Loader2, Star, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Document } from "@/api/tauri-bridge/document"
import { softDeleteDocument } from "@/api/tauri-bridge/document"
import ConfirmDialog from "@/components/common/ConfirmDialog"
import DocEmojiIcon from "@/components/common/DocEmojiIcon"
import { TableCell, TableRow } from "@/components/ui/table"
import { truncate } from "@/lib/string"
import { formatRelativeTime } from "@/lib/time"
import { useFavoritesStore } from "@/stores/favoritesStore"
import { useTabStore } from "@/stores/navigationStore"

export interface DocListItemProps {
  doc: Document
  onClick: (doc: Document) => void
  maxLength?: number
  showTime?: boolean
  onMutate?: () => void
}

export function DocListItem({
  doc,
  onClick,
  maxLength = 24,
  showTime = true,
  onMutate,
}: DocListItemProps) {
  const { t, i18n } = useTranslation("common")
  const { t: tEditor } = useTranslation("editor")
  const isFavorite = useFavoritesStore((s) => s.isFavorite(doc.id))
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite)
  const closeTab = useTabStore((s) => s.closeTab)
  const navigateActiveTab = useTabStore((s) => s.navigateActiveTab)
  const activeTabId = useTabStore((s) => s.activeTabId)
  const removeDocFromHistory = useTabStore((s) => s.removeDocFromHistory)

  const [toggling, setToggling] = useState(false)
  const [showTrashDialog, setShowTrashDialog] = useState(false)

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (toggling || doc.is_lock) return
    setToggling(true)
    try {
      await toggleFavorite(doc.id)
    } finally {
      setToggling(false)
    }
  }

  const handleMoveToTrash = async () => {
    try {
      await softDeleteDocument(doc.id)
      removeDocFromHistory(doc.id)
      activeTabId && closeTab(activeTabId)
      navigateActiveTab("all-docs")
      onMutate?.()
    } catch (err) {
      console.error("Failed to move document to trash:", err)
    }
  }

  const displayTitle = doc.title || t("unnamed")

  return (
    <>
      <TableRow
        role="button"
        tabIndex={0}
        className="cursor-pointer"
        onClick={() => onClick(doc)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onClick(doc)
          }
        }}
      >
        <TableCell className="w-8 py-2.5 pl-3 pr-0">
          <DocEmojiIcon emoji={doc.emoji} className="size-4 text-muted-foreground" />
        </TableCell>
        <TableCell className="py-2.5 pe-3">
          <span className="block truncate text-sm text-foreground">
            {truncate(displayTitle, maxLength)}
          </span>
        </TableCell>
        {showTime && (
          <TableCell className="w-24 py-2.5 pl-0 pe-3 text-right">
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(doc.updated_at, i18n.language)}
            </span>
          </TableCell>
        )}
        <TableCell className="w-20 py-2.5 pl-0 pe-3">
          <div className="flex items-center justify-end gap-0.5">
            <button
              type="button"
              className={`rounded-md p-1 transition-colors ${
                doc.is_lock
                  ? "text-muted-foreground/50 cursor-not-allowed"
                  : isFavorite
                    ? "text-yellow-500 hover:bg-yellow-500/10"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              title={
                doc.is_lock
                  ? tEditor("docLockedTitle")
                  : isFavorite
                    ? tEditor("unfavorite")
                    : tEditor("favorite")
              }
              onClick={handleToggleFavorite}
              disabled={toggling || !!doc.is_lock}
            >
              {toggling ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Star className="h-3.5 w-3.5" fill={isFavorite ? "currentColor" : "none"} />
              )}
            </button>
            <button
              type="button"
              className={`rounded-md p-1 transition-colors ${
                doc.is_lock
                  ? "text-muted-foreground/50 cursor-not-allowed"
                  : "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              }`}
              title={tEditor("moveToTrash")}
              disabled={!!doc.is_lock}
              onClick={(e) => {
                e.stopPropagation()
                setShowTrashDialog(true)
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </TableCell>
      </TableRow>
      <ConfirmDialog
        open={showTrashDialog}
        onOpenChange={setShowTrashDialog}
        title={tEditor("moveToTrashTitle")}
        description={tEditor("moveToTrashDesc", { title: displayTitle })}
        confirmText={tEditor("moveToTrash")}
        cancelText={t("cancel")}
        destructive
        onConfirm={handleMoveToTrash}
      />
    </>
  )
}
