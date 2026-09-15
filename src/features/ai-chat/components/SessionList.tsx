import { useEffect, useState } from "react"

import { MessageSquareText, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useAiChatStore } from "@/stores/aiChatStore"
import { useWorkspaceStore } from "@/stores/workspaceStore"

const PAGE_SIZE = 10

function formatSessionTime(updatedAt: string | null): string {
  if (!updatedAt) return ""
  const [date, time] = updatedAt.replace("T", " ").split(" ")
  const hm = (time ?? "").split(":").slice(0, 2).join(":")
  const md = date.length >= 10 ? date.slice(5) : date
  return hm ? `${md} ${hm}` : md
}

function buildPages(
  current: number,
  total: number
): Array<number | "ellipsis-start" | "ellipsis-end"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const wanted = new Set([1, 2, total - 1, total, current - 1, current, current + 1])
  const sorted = [...wanted].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const pages: Array<number | "ellipsis-start" | "ellipsis-end"> = []
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i]
    if (i === 0) {
      pages.push(p)
      continue
    }
    const gap = p - sorted[i - 1]
    if (gap === 1) {
      pages.push(p)
    } else if (gap === 2) {
      pages.push(sorted[i - 1] + 1, p)
    } else {
      pages.push("ellipsis-start", p)
    }
  }
  return pages
}

interface SessionListProps {
  /** Whether the hosting popover is open; used to trigger a refresh on open */
  open: boolean
  /** Called after selecting a session (e.g. to close the popover) */
  onSelect?: () => void
}

export function SessionList({ open, onSelect }: SessionListProps) {
  const { t } = useTranslation("home")
  const sessions = useAiChatStore((s) => s.sessions)
  const currentSessionId = useAiChatStore((s) => s.currentSessionId)
  const refreshSessions = useAiChatStore((s) => s.refreshSessions)
  const openSession = useAiChatStore((s) => s.openSession)
  const deleteSession = useAiChatStore((s) => s.deleteSession)
  const [loading, setLoading] = useState(true)
  const [confirmSid, setConfirmSid] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!open) return
    setPage(1)
    setConfirmSid(null)
    let cancelled = false
    setLoading(true)
    const wid = useWorkspaceStore.getState().currentWid
    if (!wid) {
      setLoading(false)
      return
    }
    refreshSessions(wid)
      .catch((err) => console.error("Failed to load chat sessions:", err))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  const totalPages = Math.max(1, Math.ceil(sessions.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = sessions.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const pageNumbers = buildPages(safePage, totalPages)

  const handleDelete = (sid: string) => {
    if (confirmSid === sid) {
      setConfirmSid(null)
      deleteSession(sid).catch((err) => console.error("Failed to delete chat session:", err))
    } else {
      setConfirmSid(sid)
      window.setTimeout(() => setConfirmSid((cur) => (cur === sid ? null : cur)), 2500)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        {t("loading")}
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
        <MessageSquareText className="mb-3 size-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">{t("noSessions")}</p>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground/70">
          {t("startNewConversation")}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto p-1">
        {pageItems.map((session) => {
          const active = session.id === currentSessionId
          const confirming = confirmSid === session.id
          return (
            <li key={session.id}>
              <div
                className={`group flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 transition-colors ${
                  active ? "bg-primary/10" : "hover:bg-muted/60"
                }`}
                onClick={() =>
                  openSession(session.id)
                    .then(onSelect)
                    .catch((err) => console.error(err))
                }
              >
                <MessageSquareText className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{session.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatSessionTime(session.updated_at) || session.model}
                  </p>
                </div>
                <Button
                  size="icon-xs"
                  variant={confirming ? "destructive" : "ghost"}
                  className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  title={confirming ? t("clickAgainToConfirm") : t("deleteSession")}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(session.id)
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </li>
          )
        })}
      </ul>

      {totalPages > 1 && (
        <Pagination className="mt-1 border-t pt-2">
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
                className={safePage >= totalPages ? "pointer-events-none opacity-40" : undefined}
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
  )
}
