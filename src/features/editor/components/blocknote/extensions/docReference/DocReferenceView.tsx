import { useEffect, useState } from "react"

import { useTranslation } from "react-i18next"

import { getDocument, type Document } from "@/api/tauri-bridge/document"
import DocEmojiIcon from "@/components/common/DocEmojiIcon"
import { cn } from "@/lib/utils"
import { useTabStore } from "@/stores/navigationStore"

interface DocReferenceViewProps {
  docId: string
  className?: string
}

function isMetaClick(e: React.MouseEvent): boolean {
  return e.metaKey || e.ctrlKey
}

function DocReferenceView({ docId, className }: DocReferenceViewProps) {
  const { t } = useTranslation("common")
  const { t: tEditor } = useTranslation("editor")
  const openDocInActiveTab = useTabStore((s) => s.openDocInActiveTab)

  const [doc, setDoc] = useState<Document | null>(null)
  const [deleted, setDeleted] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const document = await getDocument(docId)
        if (cancelled) return
        if (document.is_delete === 1) {
          setDoc(null)
          setDeleted(true)
        } else {
          setDoc(document)
          setDeleted(false)
        }
      } catch {
        if (cancelled) return
        setDoc(null)
        setDeleted(true)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [docId])

  if (deleted) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded bg-muted px-1 py-0.5 text-sm text-muted-foreground line-through italic",
          className
        )}
      >
        <DocEmojiIcon className="opacity-50" />
        {tEditor("docDeleted")}
      </span>
    )
  }

  const navigable = doc !== null

  return (
    <span
      data-navigable={navigable || undefined}
      title={
        navigable ? tEditor("openDocTooltip", { title: doc?.title || t("unnamed") }) : undefined
      }
      onMouseDown={(e) => {
        if (isMetaClick(e)) {
          e.preventDefault()
          e.stopPropagation()
        }
      }}
      onClick={(e) => {
        if (!navigable || !isMetaClick(e)) return
        e.preventDefault()
        e.stopPropagation()
        openDocInActiveTab(docId, doc?.title || t("unnamed"))
      }}
      className={cn(
        "inline-flex items-center gap-1 rounded px-1 py-0.5 align-middle text-base text-primary",
        navigable && "cursor-pointer hover:bg-primary/10",
        className
      )}
    >
      <DocEmojiIcon emoji={doc?.emoji} />
      <span className="max-w-[16rem] truncate border-b border-primary/15">
        {doc?.title || t("unnamed")}
      </span>
    </span>
  )
}

export default DocReferenceView
