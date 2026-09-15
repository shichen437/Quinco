import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react"

import { LoaderIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { docSearch, getRecentDocuments, type Document } from "@/api/tauri-bridge/document"
import DocEmojiIcon from "@/components/common/DocEmojiIcon"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useTabStore } from "@/stores/navigationStore"

export interface SearchPanelRef {
  open: () => void
}

const SEARCH_DEBOUNCE_MS = 200

const SearchPanel = forwardRef<SearchPanelRef>(function SearchPanel(_, ref) {
  const { t } = useTranslation("home")
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState("")
  const [results, setResults] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)

  const openDocInActiveTab = useTabStore((s) => s.openDocInActiveTab)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
  }))

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = keyword.trim()
    if (!trimmed) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const docs = await docSearch(trimmed, 10)
        setResults(docs)
      } catch (err) {
        console.error("Search failed:", err)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [keyword])

  useEffect(() => {
    if (!open || keyword.trim()) return

    setLoading(true)
    getRecentDocuments(10)
      .then((docs) => setResults(docs))
      .catch((err) => {
        console.error("Failed to load recent docs:", err)
        setResults([])
      })
      .finally(() => setLoading(false))
  }, [open, keyword])

  const handleSelect = useCallback(
    (doc: Document) => {
      openDocInActiveTab(doc.id, doc.title)
      setOpen(false)
      setKeyword("")
    },
    [openDocInActiveTab]
  )

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setKeyword("")
    }
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={t("searchTitle")}
      description={t("searchDesc")}
    >
      <Command shouldFilter={false}>
        <CommandInput
          placeholder={t("searchPlaceholder")}
          value={keyword}
          onValueChange={setKeyword}
        />
        <CommandList>
          {loading && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <LoaderIcon className="size-4 animate-spin" />
              <span>{t("searching")}</span>
            </div>
          )}
          <CommandEmpty>{t("noSearchResult")}</CommandEmpty>

          {!loading && results.length > 0 && (
            <>
              <CommandGroup heading={keyword.trim() ? t("searchResults") : t("recentUsed")}>
                {results.map((doc) => (
                  <CommandItem key={doc.id} value={doc.id} onSelect={() => handleSelect(doc)}>
                    <DocEmojiIcon emoji={doc.emoji} />
                    <span className="ml-1 truncate">{doc.title || t("unnamed")}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  )
})

export default SearchPanel
