import { useCallback, useEffect, useRef, useState } from "react"

import { ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  listCurrentWorkspaceDocs,
  listDocsByTag,
  type DocListItem as DocListItemType,
} from "@/api/doc"
import { toast } from "@/components/ui/toast"
import { useTabStore } from "@/store/tabStore"
import { useTagStore } from "@/store/tagStore"

import DocListItem from "./components/DocListItem"
import TagListItem from "./components/TagListItem"

type View = "docs" | "tags"

function AllDocsPage() {
  const { t } = useTranslation("allDocs")
  const { tabs, activeTabId, openTab } = useTabStore()
  const activeTab = tabs.find((t) => t.id === activeTabId)
  // 侧边栏标签点击会带 tagId，直接进入标签视图并过滤该标签
  const initialTagId = activeTab?.type === "all-docs" ? activeTab.tagId : undefined

  const [view, setView] = useState<View>(initialTagId != null ? "tags" : "docs")
  const [selectedTagId, setSelectedTagId] = useState<number | null>(initialTagId ?? null)
  const [docs, setDocs] = useState<DocListItemType[]>([])
  const [loading, setLoading] = useState(true)

  // 已激活的标签页被原地更新时组件不会重新挂载，需要同步 tab 上的 tagId 变化
  const prevTabTagId = useRef(initialTagId)
  useEffect(() => {
    if (initialTagId === prevTabTagId.current) return
    prevTabTagId.current = initialTagId
    if (initialTagId != null) {
      setView("tags")
      setSelectedTagId(initialTagId)
    } else {
      setView("docs")
      setSelectedTagId(null)
    }
  }, [initialTagId])

  const tags = useTagStore((s) => s.tags)
  const loadTags = useTagStore((s) => s.loadTags)
  const updateTag = useTagStore((s) => s.updateTag)
  const deleteTag = useTagStore((s) => s.deleteTag)

  const selectedTag = tags.find((t) => t.id === selectedTagId) ?? null

  const loadDocs = useCallback(
    async (tagId: number | null) => {
      setLoading(true)
      try {
        const list = tagId != null ? await listDocsByTag(tagId) : await listCurrentWorkspaceDocs()
        setDocs(list)
      } catch (err) {
        toast.add({
          title: t("common:operationFailed"),
          description: t("common:loadFailed"),
          type: "error",
        })
      } finally {
        setLoading(false)
      }
    },
    [t]
  )

  useEffect(() => {
    loadTags()
  }, [loadTags])

  useEffect(() => {
    // 标签列表视图不需要加载文档
    if (view === "tags" && selectedTagId == null) return
    loadDocs(view === "tags" ? selectedTagId : null)
  }, [view, selectedTagId, loadDocs])

  const handleOpenDoc = (doc: DocListItemType) => {
    openTab({ type: "editor", title: doc.title || t("common:untitled"), docId: doc.id })
  }

  const handleSelectTag = (tagId: number) => {
    setSelectedTagId(tagId)
  }

  const handleRenameTag = async (tagId: number, name: string) => {
    await updateTag(tagId, name)
  }

  const handleDeleteTag = async (tagId: number) => {
    const ok = await deleteTag(tagId)
    if (ok && selectedTagId === tagId) {
      // 删除的是当前过滤标签，回到标签列表
      setSelectedTagId(null)
    }
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-12 shrink-0 items-center justify-between px-6">
        {view === "tags" && selectedTag ? (
          <div className="flex items-center gap-1.5 text-sm">
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedTagId(null)}
            >
              {t("tags")}
            </button>
            <ChevronRight className="size-4 text-muted-foreground" />
            <span className="font-semibold">{selectedTag.name}</span>
          </div>
        ) : (
          <h1 className="text-lg font-semibold">{t("title")}</h1>
        )}
        <div className="flex items-center gap-1 rounded-md bg-muted p-0.5 text-sm">
          <button
            type="button"
            className={
              view === "docs"
                ? "rounded px-2.5 py-1 bg-background font-medium shadow-xs"
                : "rounded px-2.5 py-1 text-muted-foreground hover:text-foreground"
            }
            onClick={() => setView("docs")}
          >
            {t("docs")}
          </button>
          <button
            type="button"
            className={
              view === "tags"
                ? "rounded px-2.5 py-1 bg-background font-medium shadow-xs"
                : "rounded px-2.5 py-1 text-muted-foreground hover:text-foreground"
            }
            onClick={() => setView("tags")}
          >
            {t("tags")}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {view === "docs" &&
          (loading ? (
            <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
              {t("loading")}
            </div>
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-sm text-muted-foreground">
              {t("empty")}
            </div>
          ) : (
            <div className="space-y-0.5 px-3">
              {docs.map((doc) => (
                <DocListItem
                  key={doc.id}
                  title={doc.title}
                  emoji={doc.emoji}
                  updatedAt={doc.updatedAt}
                  onClick={() => handleOpenDoc(doc)}
                />
              ))}
            </div>
          ))}

        {view === "tags" &&
          (selectedTag ? (
            loading ? (
              <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
                {t("loading")}
              </div>
            ) : docs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-sm text-muted-foreground">
                {t("emptyTag")}
              </div>
            ) : (
              <div className="space-y-0.5 px-3">
                {docs.map((doc) => (
                  <DocListItem
                    key={doc.id}
                    title={doc.title}
                    emoji={doc.emoji}
                    updatedAt={doc.updatedAt}
                    onClick={() => handleOpenDoc(doc)}
                  />
                ))}
              </div>
            )
          ) : tags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-sm text-muted-foreground">
              {t("noTags")}
            </div>
          ) : (
            <div className="space-y-0.5 px-3">
              {tags.map((tag) => (
                <TagListItem
                  key={tag.id}
                  tag={tag}
                  onClick={() => handleSelectTag(tag.id)}
                  onRename={(name) => handleRenameTag(tag.id, name)}
                  onDelete={() => handleDeleteTag(tag.id)}
                />
              ))}
            </div>
          ))}
      </div>
    </div>
  )
}

export default AllDocsPage
