import { useCallback, useEffect, useState } from "react"

import { ChevronRight, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { getBacklinks, type Document } from "@/api/tauri-bridge/document"
import { DocListItem } from "@/components/common/DocListItem"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useTabStore } from "@/stores/navigationStore"

interface EditorBiLinksProps {
  docId: string
}

export default function EditorBiLinks({ docId }: EditorBiLinksProps) {
  const { t } = useTranslation("common")
  const { t: tEditor } = useTranslation("editor")
  const [isOpen, setIsOpen] = useState(false)
  const [backlinks, setBacklinks] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const openDocInActiveTab = useTabStore((s) => s.openDocInActiveTab)

  const loadBacklinks = useCallback(async () => {
    if (!docId) return
    setLoading(true)
    try {
      const links = await getBacklinks(docId)
      setBacklinks(links)
    } catch (err) {
      console.error("Failed to load backlinks:", err)
    } finally {
      setLoading(false)
    }
  }, [docId])

  useEffect(() => {
    if (isOpen) {
      loadBacklinks()
    }
  }, [isOpen, loadBacklinks])

  const handleOpenDocument = (doc: Document) => {
    openDocInActiveTab(doc.id, doc.title || t("unnamed"))
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="mt-2 px-18 py-2 flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <span>{tEditor("backlinks")}</span>
        <ChevronRight className={`h-3 w-3 transition-transform ${isOpen ? "rotate-90" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-18 pb-4">
          {loading ? (
            <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>{t("loading")}</span>
            </div>
          ) : backlinks.length === 0 ? (
            <div className="py-2 text-xs text-muted-foreground/60">{tEditor("noBacklinks")}</div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {backlinks.map((doc) => (
                <DocListItem
                  key={doc.id}
                  doc={doc}
                  onClick={handleOpenDocument}
                  showTime={false}
                  maxLength={32}
                />
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
