import { useCallback, useEffect, useState } from "react"

import { FileText, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { getWorkspaceDocuments, type Document } from "@/api/tauri-bridge/document"
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
import DocList from "@/features/all-docs/components/DocList"
import { buildPages } from "@/lib/pagination"

interface DocsViewProps {
  onDocClick: (doc: Document) => void
  reloadKey: number
}

function DocsView({ onDocClick, reloadKey }: DocsViewProps) {
  const { t } = useTranslation("docs")
  const [documents, setDocuments] = useState<Document[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setPage(1)
  }, [reloadKey])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getWorkspaceDocuments(page, pageSize)
      .then((res) => {
        if (cancelled) return
        setDocuments(res.items)
        setTotal(res.total)
      })
      .catch((err) => {
        console.error("Failed to load documents:", err)
        if (!cancelled) {
          setDocuments([])
          setTotal(0)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [page, pageSize, reloadKey])

  const handlePageChange = useCallback((p: number) => {
    setPage(p)
  }, [])

  if (loading && documents.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!loading && documents.length === 0 && total === 0) {
    return (
      <Empty className="border-0">
        <EmptyMedia variant="icon">
          <FileText className="size-6" />
        </EmptyMedia>
        <EmptyTitle>{t("noDocs")}</EmptyTitle>
        <EmptyDescription>{t("createFirstDoc")}</EmptyDescription>
      </Empty>
    )
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageNumbers = buildPages(safePage, totalPages)

  return (
    <div className="space-y-2">
      <span className="inline-block rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
        {t("allDocs")}
      </span>

      <DocList documents={documents} onDocClick={onDocClick} />

      {totalPages > 1 && (
        <Pagination className="pt-2">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                className={safePage <= 1 ? "pointer-events-none opacity-40" : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  if (safePage > 1) handlePageChange(safePage - 1)
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
                      handlePageChange(p)
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
                className={safePage >= totalPages ? "pointer-events-none opacity-40" : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  if (safePage < totalPages) handlePageChange(safePage + 1)
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}

export default DocsView
