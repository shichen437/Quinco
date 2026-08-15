import { useEffect, useState } from "react"

import { ChevronDown } from "lucide-react"
import { useTranslation } from "react-i18next"

import { listBidirectionalLinks, type DocLinkItem } from "@/api/doc"
import DocIcon from "@/components/common/DocIcon"
import { cn } from "@/lib/utils"
import { useTabStore } from "@/store/tabStore"

interface EditorBacklinksProps {
  docId: string
}

function EditorBacklinks({ docId }: EditorBacklinksProps) {
  const [expanded, setExpanded] = useState(false)
  const [backlinks, setBacklinks] = useState<DocLinkItem[]>([])
  const openTab = useTabStore((s) => s.openTab)
  const { t } = useTranslation("editor")

  // 加载当前文档的双向链接数据
  useEffect(() => {
    setBacklinks([])

    let cancelled = false
    listBidirectionalLinks(docId)
      .then((links) => {
        if (cancelled) return
        setBacklinks(links.reverseLinks)
      })
      .catch((err) => {
        console.error("加载反向链接失败", err)
      })

    return () => {
      cancelled = true
    }
  }, [docId])

  const handleOpenDoc = (link: DocLinkItem) => {
    openTab({ type: "editor", title: link.title || t("common:untitled"), docId: link.id })
  }

  return (
    <div className="px-6">
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-md py-2 text-sm text-muted-foreground hover:text-foreground"
        onClick={() => setExpanded(!expanded)}
      >
        <span>{t("backlinks", { count: backlinks.length })}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 transition-transform", !expanded && "-rotate-90")}
        />
      </button>
      {expanded && (
        <div className="space-y-4 pb-4 pl-2">
          <div>
            {backlinks.length > 0 ? (
              <ul className="space-y-1">
                {backlinks.map((link) => (
                  <li
                    key={link.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent"
                    onClick={() => handleOpenDoc(link)}
                  >
                    <DocIcon emoji={link.emoji} className="text-muted-foreground" />
                    <span className="truncate">{link.title || t("common:untitled")}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t("noBacklinks")}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default EditorBacklinks
