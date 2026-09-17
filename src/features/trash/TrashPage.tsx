import { useCallback, useEffect, useRef, useState } from "react"

import { Loader2, RotateCcw, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  emptyTrash,
  getDeletedDocuments,
  hardDeleteDocument,
  restoreDocument,
  type Document,
} from "@/api/tauri-bridge/document"
import ConfirmDialog from "@/components/common/ConfirmDialog"
import DocEmojiIcon from "@/components/common/DocEmojiIcon"
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { buildPages } from "@/lib/pagination"
import { truncate } from "@/lib/string"
import { formatRelativeTime } from "@/lib/time"

interface TrashTableRowProps {
  doc: Document
  onRestore: (doc: Document) => void
  onDelete: (doc: Document) => void
}

function TrashTableRow({ doc, onRestore, onDelete }: TrashTableRowProps) {
  const { t, i18n } = useTranslation("docs")
  return (
    <TableRow>
      <TableCell className="w-8 py-2.5 pl-3 pr-0">
        <DocEmojiIcon emoji={doc.emoji} className="size-4 text-muted-foreground" />
      </TableCell>
      <TableCell className="py-2.5">
        <span className="block truncate text-sm text-foreground">
          {truncate(doc.title || t("unnamed", { ns: "common" }), 24)}
        </span>
      </TableCell>
      <TableCell className="w-20 py-2.5 text-right">
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(doc.deleted_at, i18n.language)}
        </span>
      </TableCell>
      <TableCell className="w-20 py-2.5 pl-0 pe-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  aria-label={t("restoreDoc")}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus-visible:bg-accent"
                  onClick={() => onRestore(doc)}
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
                  onClick={() => onDelete(doc)}
                >
                  <Trash2 className="size-4" />
                </button>
              }
            />
            <TooltipContent>{t("permanentDelete")}</TooltipContent>
          </Tooltip>
        </div>
      </TableCell>
    </TableRow>
  )
}

function TrashPage() {
  const { t } = useTranslation("docs")
  const [documents, setDocuments] = useState<Document[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [loading, setLoading] = useState(true)
  const [actionTarget, setActionTarget] = useState<Document | null>(null)
  const [confirmAction, setConfirmAction] = useState<"restore" | "delete" | "empty" | null>(null)
  const cancelledRef = useRef(false)

  const loadDocuments = useCallback(async (p: number, ps: number) => {
    cancelledRef.current = false
    setLoading(true)
    try {
      const res = await getDeletedDocuments(p, ps)
      if (cancelledRef.current) return
      setDocuments(res.items)
      setTotal(res.total)
    } catch (err) {
      console.error("Failed to load deleted documents:", err)
      if (!cancelledRef.current) {
        setDocuments([])
        setTotal(0)
      }
    } finally {
      if (!cancelledRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDocuments(page, pageSize)
    return () => {
      cancelledRef.current = true
    }
  }, [page, pageSize, loadDocuments])

  const handleRestore = useCallback(async () => {
    if (!actionTarget) return
    await restoreDocument(actionTarget.id)
    if (documents.length === 1 && page > 1) {
      setPage(page - 1)
    } else {
      loadDocuments(page, pageSize)
    }
  }, [actionTarget, documents.length, page, pageSize, loadDocuments])

  const handleHardDelete = useCallback(async () => {
    if (!actionTarget) return
    await hardDeleteDocument(actionTarget.id)
    if (documents.length === 1 && page > 1) {
      setPage(page - 1)
    } else {
      loadDocuments(page, pageSize)
    }
  }, [actionTarget, documents.length, page, pageSize, loadDocuments])

  const handleEmptyTrash = useCallback(async () => {
    try {
      await emptyTrash()
      setPage(1)
      loadDocuments(1, pageSize)
    } catch {
      // 错误已由 call() 内部通过 toast 提示
    }
  }, [pageSize, loadDocuments])

  const openConfirm = useCallback(
    (doc: Document | null, action: "restore" | "delete" | "empty") => {
      setActionTarget(doc)
      setConfirmAction(action)
    },
    []
  )

  const closeConfirm = useCallback(() => {
    setActionTarget(null)
    setConfirmAction(null)
  }, [])

  const confirmTitle =
    confirmAction === "empty"
      ? t("emptyTrash")
      : confirmAction === "delete"
        ? t("permanentDeleteDoc")
        : t("restoreDoc")
  const confirmDescription =
    confirmAction === "empty"
      ? t("emptyTrashDesc")
      : confirmAction === "delete"
        ? t("permanentDeleteDocDesc")
        : t("restoreDocDesc")

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageNumbers = buildPages(safePage, totalPages)

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="shrink-0 flex items-center justify-between px-12 pt-8 pb-4">
        <h1 className="font-semibold text-foreground">{t("trash")}</h1>
        {total > 0 && (
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            onClick={() => openConfirm(null, "empty")}
          >
            <Trash2 className="size-3.5" />
            <span>{t("emptyTrash")}</span>
          </button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-12 pb-8">
        {loading && documents.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : !loading && documents.length === 0 && total === 0 ? (
          <Empty className="border-0">
            <EmptyMedia variant="icon">
              <Trash2 className="size-6" />
            </EmptyMedia>
            <EmptyTitle>{t("trashEmpty")}</EmptyTitle>
            <EmptyDescription>{t("trashEmptyDesc")}</EmptyDescription>
          </Empty>
        ) : (
          <div>
            <Table className="[&_tr]:border-0 [&_thead_tr]:border-0">
              <TableBody>
                {documents.map((doc) => (
                  <TrashTableRow
                    key={doc.id}
                    doc={doc}
                    onRestore={(d) => openConfirm(d, "restore")}
                    onDelete={(d) => openConfirm(d, "delete")}
                  />
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <Pagination className="pt-2">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      className={safePage <= 1 ? "pointer-events-none opacity-40" : undefined}
                      onClick={(e) => {
                        e.preventDefault()
                        if (safePage > 1) setPage(safePage - 1)
                      }}
                    />
                  </PaginationItem>
                  {pageNumbers.map((p, i) =>
                    typeof p === "number" ? (
                      <PaginationItem key={p}>
                        <PaginationLink
                          isActive={p === safePage}
                          size="icon-xs"
                          onClick={(e) => {
                            e.preventDefault()
                            setPage(p)
                          }}
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={`${p}-${i}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      className={
                        safePage >= totalPages ? "pointer-events-none opacity-40" : undefined
                      }
                      onClick={(e) => {
                        e.preventDefault()
                        if (safePage < totalPages) setPage(safePage + 1)
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
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
        destructive={confirmAction === "delete" || confirmAction === "empty"}
        onConfirm={
          confirmAction === "empty"
            ? handleEmptyTrash
            : confirmAction === "delete"
              ? handleHardDelete
              : handleRestore
        }
        onSuccess={closeConfirm}
      />
    </div>
  )
}

export default TrashPage
