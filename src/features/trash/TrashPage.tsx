import { useCallback, useEffect, useState } from "react"

import { RotateCcw, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  getDeletedDocuments,
  hardDeleteDocument,
  restoreDocument,
  type Document,
} from "@/api/tauri-bridge/document"
import ConfirmDialog from "@/components/common/ConfirmDialog"
import DocEmojiIcon from "@/components/common/DocEmojiIcon"
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { truncate } from "@/lib/string"
import { formatRelativeTime } from "@/lib/time"

function TrashPage() {
  const { t, i18n } = useTranslation("docs")
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [actionTarget, setActionTarget] = useState<Document | null>(null)
  const [confirmAction, setConfirmAction] = useState<"restore" | "delete" | null>(null)

  const loadDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const docs = await getDeletedDocuments()
      setDocuments(docs)
    } catch (err) {
      console.error("Failed to load deleted documents:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const handleRestore = useCallback(async () => {
    if (!actionTarget) return
    await restoreDocument(actionTarget.id)
    await loadDocuments()
  }, [actionTarget, loadDocuments])

  const handleHardDelete = useCallback(async () => {
    if (!actionTarget) return
    await hardDeleteDocument(actionTarget.id)
    await loadDocuments()
  }, [actionTarget, loadDocuments])

  const openConfirm = useCallback((doc: Document, action: "restore" | "delete") => {
    setActionTarget(doc)
    setConfirmAction(action)
  }, [])

  const closeConfirm = useCallback(() => {
    setActionTarget(null)
    setConfirmAction(null)
  }, [])

  const confirmTitle = confirmAction === "delete" ? t("permanentDeleteDoc") : t("restoreDoc")
  const confirmDescription =
    confirmAction === "delete" ? t("permanentDeleteDocDesc") : t("restoreDocDesc")

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="shrink-0 flex items-center px-12 pt-8 pb-4">
        <h1 className="font-semibold text-foreground">{t("trash")}</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-12 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-sm text-muted-foreground">{t("loading", { ns: "common" })}</div>
          </div>
        ) : documents.length === 0 ? (
          <Empty className="border-0">
            <EmptyMedia variant="icon">
              <Trash2 className="size-6" />
            </EmptyMedia>
            <EmptyTitle>{t("trashEmpty")}</EmptyTitle>
            <EmptyDescription>{t("trashEmptyDesc")}</EmptyDescription>
          </Empty>
        ) : (
          <div className="space-y-0.5">
            <div className="flex items-center gap-4 px-3 py-2 text-xs font-medium text-muted-foreground">
              <span className="flex-1">{t("title")}</span>
              <span className="w-20 text-right">{t("deletedAt")}</span>
              <span className="w-20 text-right">{t("actions")}</span>
            </div>

            <div className="space-y-0.5">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-4 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/50 focus-within:bg-accent/50"
                >
                  <DocEmojiIcon
                    emoji={doc.emoji}
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                  <span className="flex-1 truncate text-sm text-foreground">
                    {truncate(doc.title || t("unnamed", { ns: "common" }), 24)}
                  </span>
                  <span className="w-24 shrink-0 text-right text-xs text-muted-foreground">
                    {formatRelativeTime(doc.deleted_at, i18n.language)}
                  </span>
                  <div className="flex w-20 shrink-0 items-center justify-end gap-1">
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <button
                            type="button"
                            aria-label={t("restoreDoc")}
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus-visible:bg-accent"
                            onClick={() => openConfirm(doc, "restore")}
                          >
                            <RotateCcw className="size-4" />
                          </button>
                        }
                      />
                      <TooltipContent>{t("restore")}</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <button
                            type="button"
                            aria-label={t("permanentDeleteDoc")}
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus:outline-none focus-visible:bg-destructive/10"
                            onClick={() => openConfirm(doc, "delete")}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        }
                      />
                      <TooltipContent>{t("permanentDelete")}</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) closeConfirm()
        }}
        title={confirmTitle}
        description={confirmDescription}
        destructive={confirmAction === "delete"}
        onConfirm={confirmAction === "delete" ? handleHardDelete : handleRestore}
        onSuccess={closeConfirm}
      />
    </div>
  )
}

export default TrashPage
