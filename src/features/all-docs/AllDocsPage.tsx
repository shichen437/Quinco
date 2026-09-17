import { useCallback, useEffect, useState } from "react"

import { FileText, Hash } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Document } from "@/api/tauri-bridge/document"
import DocsView from "@/features/all-docs/components/DocsView"
import TagsView from "@/features/all-docs/components/TagsView"
import { useTabStore } from "@/stores/navigationStore"

type ViewMode = "docs" | "tags"

function AllDocsPage() {
  const { t } = useTranslation("common")
  const { t: tDocs } = useTranslation("docs")
  const openDocInActiveTab = useTabStore((s) => s.openDocInActiveTab)
  const openTagInActiveTab = useTabStore((s) => s.openTagInActiveTab)
  const clearActiveTabTag = useTabStore((s) => s.clearActiveTabTag)
  // 当前激活标签页要打开的标签 id（来自侧边栏点击 / 标签页历史导航）
  const activeTagId = useTabStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId)
    return tab?.tagId
  })

  const [viewMode, setViewMode] = useState<ViewMode>(activeTagId ? "tags" : "docs")
  const [reloadKey, setReloadKey] = useState(0)

  // 切换视图时递增 reloadKey，触发子组件重新加载并回到第一页
  const switchView = useCallback((mode: ViewMode) => {
    setViewMode(mode)
    setReloadKey((k) => k + 1)
  }, [])

  // 激活标签页需要打开某个标签时，确保切换到标签视图
  useEffect(() => {
    if (activeTagId) {
      setViewMode("tags")
      setReloadKey((k) => k + 1)
    }
  }, [activeTagId])

  const handleDocClick = useCallback(
    (doc: Document) => {
      openDocInActiveTab(doc.id, doc.title || t("unnamed"))
    },
    [openDocInActiveTab]
  )

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="shrink-0 flex items-center gap-1 px-12 pt-8 pb-4">
        <button
          type="button"
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium transition-colors ${
            viewMode === "docs"
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => {
            switchView("docs")
            clearActiveTabTag()
          }}
        >
          <FileText className="size-4" />
          <span>{tDocs("docs")}</span>
        </button>
        <button
          type="button"
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium transition-colors ${
            viewMode === "tags"
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => switchView("tags")}
        >
          <Hash className="size-4" />
          <span>{tDocs("tags")}</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-12 pb-8">
        {viewMode === "docs" ? (
          <DocsView key={`docs-${reloadKey}`} onDocClick={handleDocClick} reloadKey={reloadKey} />
        ) : (
          <TagsView
            key={`tags-${reloadKey}`}
            onDocClick={handleDocClick}
            activeTagId={activeTagId}
            onTagSelect={(tag) => openTagInActiveTab(tag.id)}
            onBackToTags={() => clearActiveTabTag()}
          />
        )}
      </main>
    </div>
  )
}

export default AllDocsPage
