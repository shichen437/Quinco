import { useCallback, useEffect, useState } from "react"

import { Hash, Loader2, Pencil, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { getDocument, type Document } from "@/api/tauri-bridge/document"
import {
  deleteTag,
  getTagDocs,
  getWorkspaceTags,
  updateTag,
  type TagDTO,
} from "@/api/tauri-bridge/tag"
import ConfirmDialog from "@/components/common/ConfirmDialog"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
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
import DocList from "@/features/all-docs/components/DocList"
import { buildPages } from "@/lib/pagination"
import { TAG_COLORS } from "@/lib/tag_color"

interface TagsViewProps {
  onDocClick: (doc: Document) => void
  activeTagId?: number
  onTagSelect: (tag: TagDTO) => void
  onBackToTags: () => void
}

function TagDot({ color }: { color: string }) {
  return <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
}

interface EditTagFormProps {
  defaultName: string
  defaultColor: string
  onSubmit: (name: string, color: string) => void
}

function EditTagForm({ defaultName, defaultColor, onSubmit }: EditTagFormProps) {
  const { t } = useTranslation("docs")
  const [name, setName] = useState(defaultName)
  const [color, setColor] = useState(defaultColor)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSubmit(name.trim(), color)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{t("tagName")}</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("inputTagName")}
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{t("color")}</label>
        <div className="flex flex-wrap gap-2">
          {TAG_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`size-7 rounded-full transition-all ${
                color === c
                  ? "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110"
                  : "hover:scale-110"
              }`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
              aria-label={t("selectColor", { color: c })}
            />
          ))}
        </div>
      </div>
      <DialogFooter>
        <DialogClose
          render={
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              {t("cancel")}
            </button>
          }
        />
        <button
          type="submit"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          disabled={!name.trim()}
        >
          {t("save")}
        </button>
      </DialogFooter>
    </form>
  )
}

function TagsView({ onDocClick, activeTagId, onTagSelect, onBackToTags }: TagsViewProps) {
  const { t } = useTranslation("docs")
  const [tags, setTags] = useState<TagDTO[]>([])
  const [tagsTotal, setTagsTotal] = useState(0)
  const [tagPage, setTagPage] = useState(1)
  const [tagPageSize] = useState(20)
  const [tagsLoading, setTagsLoading] = useState(true)

  const [editingTag, setEditingTag] = useState<TagDTO | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [deletingTag, setDeletingTag] = useState<TagDTO | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [selectedTag, setSelectedTag] = useState<TagDTO | null>(null)
  const [selectedDocs, setSelectedDocs] = useState<Document[]>([])
  const [docsLoading, setDocsLoading] = useState(false)

  // 加载标签列表（分页）
  useEffect(() => {
    let cancelled = false
    setTagsLoading(true)
    getWorkspaceTags(tagPage, tagPageSize)
      .then((res) => {
        if (cancelled) return
        setTags(res.items)
        setTagsTotal(res.total)
      })
      .catch((err) => {
        console.error("Failed to load tags:", err)
        if (!cancelled) {
          setTags([])
          setTagsTotal(0)
        }
      })
      .finally(() => {
        if (!cancelled) setTagsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tagPage, tagPageSize])

  const handleEditSubmit = useCallback(
    async (name: string, color: string) => {
      if (!editingTag) return
      setEditLoading(true)
      try {
        const updated = await updateTag(editingTag.id, name, color)
        setTags((prev) => prev.map((tag) => (tag.id === updated.id ? updated : tag)))
        setEditingTag(null)
      } catch (err) {
        console.error("Failed to update tag:", err)
      } finally {
        setEditLoading(false)
      }
    },
    [editingTag]
  )

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingTag) return
    setDeleteLoading(true)
    try {
      await deleteTag(deletingTag.id)
      setTags((prev) => prev.filter((tag) => tag.id !== deletingTag.id))
      setTagsTotal((prev) => Math.max(0, prev - 1))
      if (selectedTag?.id === deletingTag.id) {
        setSelectedTag(null)
        setSelectedDocs([])
      }
    } catch (err) {
      console.error("Failed to delete tag:", err)
    } finally {
      setDeleteLoading(false)
    }
  }, [deletingTag, selectedTag])

  // 同步外部请求（侧边栏标签点击 / 标签页历史导航）到标签视图。
  // 仅当实际展示的 selectedTag 与请求不一致时才去加载，避免重复请求。
  useEffect(() => {
    if (!activeTagId) {
      if (selectedTag) {
        setSelectedTag(null)
        setSelectedDocs([])
      }
      return
    }

    if (selectedTag?.id === activeTagId) return

    const tag = tags.find((tt) => tt.id === activeTagId)
    if (!tag) return // 标签列表尚未加载完成，等待 tags 变化后再选择

    setSelectedTag(tag)
    setDocsLoading(true)
    getTagDocs(tag.id)
      .then((docIds) => Promise.allSettled(docIds.map((id) => getDocument(id))))
      .then((results) => {
        const docs = results
          .filter((r): r is PromiseFulfilledResult<Document> => r.status === "fulfilled")
          .map((r) => r.value)
        setSelectedDocs(docs)
      })
      .catch((err) => {
        console.error("Failed to load tag documents:", err)
        setSelectedDocs([])
      })
      .finally(() => setDocsLoading(false))
  }, [activeTagId, tags, selectedTag])

  const handleTagSelect = useCallback(
    (tag: TagDTO) => {
      onTagSelect(tag)
    },
    [onTagSelect]
  )

  const handleBackToTags = useCallback(() => {
    setSelectedTag(null)
    setSelectedDocs([])
    onBackToTags()
  }, [onBackToTags])

  const renderTagPagination = () => {
    const totalPages = Math.max(1, Math.ceil(tagsTotal / tagPageSize))
    if (totalPages <= 1) return null
    const safePage = Math.min(tagPage, totalPages)
    const pageNumbers = buildPages(safePage, totalPages)
    return (
      <Pagination className="pt-2">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              className={safePage <= 1 ? "pointer-events-none opacity-40" : undefined}
              onClick={(e) => {
                e.preventDefault()
                if (safePage > 1) setTagPage(safePage - 1)
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
                    setTagPage(p)
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
                if (safePage < totalPages) setTagPage(safePage + 1)
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
  }

  if (tagsLoading && tags.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (selectedTag) {
    return (
      <>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-block rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
              onClick={handleBackToTags}
            >
              {t("allTags")}
            </button>
            <span className="text-muted-foreground">/</span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-foreground">
              <TagDot color={selectedTag.color} />
              {selectedTag.name}
            </span>
          </div>

          {docsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : selectedDocs.length === 0 ? (
            <Empty className="border-0">
              <EmptyMedia variant="icon">
                <Hash className="size-6" />
              </EmptyMedia>
              <EmptyTitle>{t("noDocs")}</EmptyTitle>
              <EmptyDescription>{t("noDocsUnderTag")}</EmptyDescription>
            </Empty>
          ) : (
            <DocList documents={selectedDocs} onDocClick={onDocClick} />
          )}
        </div>

        {(editLoading || deleteLoading) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        )}
      </>
    )
  }

  if (tags.length === 0 && tagsTotal === 0) {
    return (
      <Empty className="border-0">
        <EmptyMedia variant="icon">
          <Hash className="size-6" />
        </EmptyMedia>
        <EmptyTitle>{t("noTags")}</EmptyTitle>
        <EmptyDescription>{t("noTagsDesc")}</EmptyDescription>
      </Empty>
    )
  }

  return (
    <>
      <div className="space-y-2">
        <span className="inline-block rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
          {t("allTags")}
        </span>

        <Table className="[&_tr]:border-0 [&_thead_tr]:border-0">
          <TableBody>
            {tags.map((tag) => (
              <TableRow
                key={tag.id}
                className="group cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={() => handleTagSelect(tag)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    handleTagSelect(tag)
                  }
                }}
              >
                <TableCell className="w-8 py-2.5 pl-3 pr-0">
                  <div className="flex h-full items-center">
                    <TagDot color={tag.color} />
                  </div>
                </TableCell>
                <TableCell className="py-2.5">
                  <span className="block truncate text-sm text-foreground">{tag.name}</span>
                </TableCell>
                <TableCell className="w-20 py-2.5 pl-0 pe-3 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingTag(tag)
                      }}
                      aria-label={t("editTag")}
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeletingTag(tag)
                      }}
                      aria-label={t("deleteTag")}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {renderTagPagination()}
      </div>

      <Dialog open={!!editingTag} onOpenChange={(open) => !open && setEditingTag(null)}>
        {editingTag && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("editTag")}</DialogTitle>
            </DialogHeader>
            <EditTagForm
              defaultName={editingTag.name}
              defaultColor={editingTag.color}
              onSubmit={handleEditSubmit}
            />
          </DialogContent>
        )}
      </Dialog>

      <ConfirmDialog
        open={!!deletingTag}
        onOpenChange={(open) => !open && !deleteLoading && setDeletingTag(null)}
        title={t("deleteTagTitle")}
        description={t("deleteTagDesc", { name: deletingTag?.name ?? "" })}
        destructive
        onConfirm={handleDeleteConfirm}
        onSuccess={() => setDeletingTag(null)}
      />

      {(editLoading || deleteLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      )}
    </>
  )
}

export default TagsView
