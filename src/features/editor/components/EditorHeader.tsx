import { useState } from "react"

import { Loader2, Lock, LockOpen, MoreHorizontal, Star, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { softDeleteDocument } from "@/api/tauri-bridge/document"
import ConfirmDialog from "@/components/common/ConfirmDialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { truncate } from "@/lib/string"
import { useFavoritesStore } from "@/stores/favoritesStore"
import { useTabStore } from "@/stores/navigationStore"

interface EditorHeaderProps {
  title: string
  docId?: string
  isLocked: boolean
  onToggleLock: () => Promise<void>
}

export default function EditorHeader({ title, docId, isLocked, onToggleLock }: EditorHeaderProps) {
  const { t } = useTranslation("common")
  const { t: tEditor } = useTranslation("editor")
  const isFavorite = useFavoritesStore((s) => (docId ? s.isFavorite(docId) : false))
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite)
  const [toggling, setToggling] = useState(false)
  const [locking, setLocking] = useState(false)
  const [showTrashDialog, setShowTrashDialog] = useState(false)
  const closeTab = useTabStore((s) => s.closeTab)
  const navigateActiveTab = useTabStore((s) => s.navigateActiveTab)
  const activeTabId = useTabStore((s) => s.activeTabId)

  const handleToggleFavorite = async () => {
    if (!docId || toggling || isLocked) return
    setToggling(true)
    try {
      await toggleFavorite(docId)
    } finally {
      setToggling(false)
    }
  }

  const handleToggleLock = async () => {
    if (locking) return
    setLocking(true)
    try {
      await onToggleLock()
    } finally {
      setLocking(false)
    }
  }

  const handleMoveToTrash = async () => {
    if (!docId) return
    try {
      await softDeleteDocument(docId)
      useTabStore.getState().removeDocFromHistory(docId)
      activeTabId && closeTab(activeTabId)
      navigateActiveTab("all-docs")
    } catch (err) {
      console.error("Failed to move document to trash:", err)
    }
  }

  const displayTitle = title || t("unnamed")

  return (
    <header className="shrink-0 w-full px-4 pt-4 pb-1">
      <div className="flex items-center justify-between gap-1 text-sm mb-2">
        <span>{truncate(displayTitle, 10)}</span>
        <div className="flex items-center gap-1">
          {isLocked && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              {tEditor("docLocked")}
            </span>
          )}
          <button
            type="button"
            className={`rounded-md p-1 transition-colors ${
              isLocked
                ? "text-muted-foreground/50 cursor-not-allowed"
                : isFavorite
                  ? "text-yellow-500 hover:bg-yellow-500/10"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            title={
              isLocked
                ? tEditor("docLockedTitle")
                : isFavorite
                  ? tEditor("unfavorite")
                  : tEditor("favorite")
            }
            onClick={handleToggleFavorite}
            disabled={toggling || !docId || isLocked}
          >
            {toggling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Star className="h-4 w-4" fill={isFavorite ? "currentColor" : "none"} />
            )}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger
              type="button"
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors inline-flex items-center justify-center"
              title={tEditor("more")}
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-45">
              <DropdownMenuItem onClick={handleToggleLock} disabled={locking}>
                {locking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isLocked ? (
                  <LockOpen className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                <span>{isLocked ? tEditor("unlockDoc") : tEditor("lockDoc")}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowTrashDialog(true)}
                disabled={isLocked}
                className={isLocked ? "" : "text-destructive focus:text-destructive"}
              >
                <Trash2 className="h-4 w-4" />
                <span>{tEditor("moveToTrash")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
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
    </header>
  )
}
