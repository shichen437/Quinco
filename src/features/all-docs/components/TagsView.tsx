import { useCallback, useState } from "react"

import { Hash, Loader2, Pencil, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { getDocument, type Document } from "@/api/tauri-bridge/document"
import { deleteTag, getTagDocs, updateTag, type TagDTO } from "@/api/tauri-bridge/tag"
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
import DocList from "@/features/all-docs/components/DocList"
import { TAG_COLORS } from "@/lib/tag_color"

interface TagsViewProps {
  tags: TagDTO[]
  onTagsChange: (tags: TagDTO[]) => void
  onDocClick: (doc: Document) => void
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

function TagsView({ tags, onTagsChange, onDocClick }: TagsViewProps) {
  const { t } = useTranslation("docs")
  const [editingTag, setEditingTag] = useState<TagDTO | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [deletingTag, setDeletingTag] = useState<TagDTO | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [selectedTag, setSelectedTag] = useState<TagDTO | null>(null)
  const [selectedDocs, setSelectedDocs] = useState<Document[]>([])
  const [docsLoading, setDocsLoading] = useState(false)

  const handleEditSubmit = useCallback(
    async (name: string, color: string) => {
      if (!editingTag) return
      setEditLoading(true)
      try {
        const updated = await updateTag(editingTag.id, name, color)
        onTagsChange(tags.map((t) => (t.id === updated.id ? updated : t)))
        setEditingTag(null)
      } catch (err) {
        console.error("Failed to update tag:", err)
      } finally {
        setEditLoading(false)
      }
    },
    [editingTag, tags, onTagsChange]
  )

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingTag) return
    setDeleteLoading(true)
    try {
      await deleteTag(deletingTag.id)
      onTagsChange(tags.filter((t) => t.id !== deletingTag.id))
      if (selectedTag?.id === deletingTag.id) {
        setSelectedTag(null)
        setSelectedDocs([])
      }
    } catch (err) {
      console.error("Failed to delete tag:", err)
    } finally {
      setDeleteLoading(false)
    }
  }, [deletingTag, tags, onTagsChange, selectedTag])

  const handleTagSelect = useCallback(async (tag: TagDTO) => {
    setSelectedTag(tag)
    setDocsLoading(true)
    try {
      const docIds = await getTagDocs(tag.id)
      const docs = await Promise.all(docIds.map((id) => getDocument(id)))
      setSelectedDocs(docs)
    } catch (err) {
      console.error("Failed to load tag documents:", err)
      setSelectedDocs([])
    } finally {
      setDocsLoading(false)
    }
  }, [])

  const handleBackToTags = useCallback(() => {
    setSelectedTag(null)
    setSelectedDocs([])
  }, [])

  if (tags.length === 0) {
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

  return (
    <>
      <div className="space-y-2">
        <span className="inline-block rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
          {t("allTags")}
        </span>

        <div className="space-y-0.5">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="group flex items-center gap-4 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/50 cursor-pointer"
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
              <TagDot color={tag.color} />
              <span className="flex-1 truncate text-sm text-foreground">{tag.name}</span>
              <div
                className="flex w-20 items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  onClick={() => setEditingTag(tag)}
                  aria-label={t("editTag")}
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  onClick={() => setDeletingTag(tag)}
                  aria-label={t("deleteTag")}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
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
