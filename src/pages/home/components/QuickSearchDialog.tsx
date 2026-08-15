import { useEffect, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

import { quickSearchDocs, type DocListItem } from "@/api/doc"
import DocIcon from "@/components/common/DocIcon"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useTabStore } from "@/store/tabStore"

// 默认展示的文档数量
const DEFAULT_LIMIT = 5

function QuickSearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation("search")
  const openTab = useTabStore((s) => s.openTab)
  const [query, setQuery] = useState("")
  const [docs, setDocs] = useState<DocListItem[]>([])
  // 请求序号，丢弃过期响应
  const requestSeq = useRef(0)

  useEffect(() => {
    if (!open) {
      setQuery("")
      setDocs([])
      return
    }

    // 输入防抖，空关键词时立即加载最近文档
    const timer = setTimeout(
      () => {
        const seq = ++requestSeq.current
        quickSearchDocs(query, DEFAULT_LIMIT)
          .then((items) => {
            if (requestSeq.current === seq) setDocs(items)
          })
          .catch(() => {})
      },
      query.trim() ? 200 : 0
    )

    return () => clearTimeout(timer)
  }, [open, query])

  const handleSelect = (doc: DocListItem) => {
    openTab({ type: "editor", title: doc.title || t("common:untitled"), docId: doc.id })
    onOpenChange(false)
  }

  return (
    <CommandDialog
      title={t("title")}
      description={t("description")}
      open={open}
      onOpenChange={onOpenChange}
    >
      <Command shouldFilter={false}>
        <CommandInput placeholder={t("placeholder")} value={query} onValueChange={setQuery} />
        <CommandList>
          <CommandEmpty>{t("noMatch")}</CommandEmpty>
          {docs.length > 0 && (
            <CommandGroup heading={query.trim() ? t("searchResult") : t("recent")}>
              {docs.map((doc) => (
                <CommandItem key={doc.id} value={doc.id} onSelect={() => handleSelect(doc)}>
                  <DocIcon emoji={doc.emoji} />
                  <span>{doc.title || t("common:untitled")}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}

export default QuickSearchDialog
