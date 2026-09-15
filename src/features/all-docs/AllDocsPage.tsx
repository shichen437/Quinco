import { useCallback, useEffect, useState } from "react"

import { FileText, Hash, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { getWorkspaceDocuments, type Document } from "@/api/tauri-bridge/document"
import { getWorkspaceTags, type TagDTO } from "@/api/tauri-bridge/tag"
import DocsView from "@/features/all-docs/components/DocsView"
import TagsView from "@/features/all-docs/components/TagsView"
import { useTabStore } from "@/stores/navigationStore"

type ViewMode = "docs" | "tags"

function AllDocsPage() {
  const { t } = useTranslation("common")
  const { t: tDocs } = useTranslation("docs")
  const [viewMode, setViewMode] = useState<ViewMode>("docs")
  const [documents, setDocuments] = useState<Document[]>([])
  const [tags, setTags] = useState<TagDTO[]>([])
  const [loading, setLoading] = useState(true)

  const openDocInActiveTab = useTabStore((s) => s.openDocInActiveTab)

  const loadDocuments = useCallback(async () => {
    try {
      const docs = await getWorkspaceDocuments()
      setDocuments(docs)
    } catch (err) {
      console.error("Failed to load documents:", err)
    }
  }, [])

  const loadTags = useCallback(async () => {
    try {
      const result = await getWorkspaceTags()
      setTags(result)
    } catch (err) {
      console.error("Failed to load tags:", err)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    const loader = viewMode === "docs" ? loadDocuments : loadTags
    loader().finally(() => setLoading(false))
  }, [viewMode, loadDocuments, loadTags])

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
          onClick={() => setViewMode("docs")}
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
          onClick={() => setViewMode("tags")}
        >
          <Hash className="size-4" />
          <span>{tDocs("tags")}</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-12 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : viewMode === "docs" ? (
          <DocsView documents={documents} onDocClick={handleDocClick} />
        ) : (
          <TagsView tags={tags} onTagsChange={setTags} onDocClick={handleDocClick} />
        )}
      </main>
    </div>
  )
}

export default AllDocsPage
