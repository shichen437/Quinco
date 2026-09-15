import { useCallback } from "react"

import { SuggestionMenuController, useBlockNoteEditor } from "@blocknote/react"
import type { DefaultReactSuggestionItem, SuggestionMenuProps } from "@blocknote/react"
import { FilePlus2, Search } from "lucide-react"
import { useTranslation as useI18n } from "react-i18next"

import {
  createDocument,
  docSearch,
  getRecentDocuments,
  type Document,
} from "@/api/tauri-bridge/document"
import DocEmojiIcon from "@/components/common/DocEmojiIcon"
import { truncate } from "@/lib/string"
import { cn } from "@/lib/utils"

import { blocknoteSchema } from "../../schema"

export const DOC_REFERENCE_TRIGGER = "[["
const MAX_RESULTS = 5
const MAX_TITLE_LENGTH = 16

function DocReferencePopover({
  items,
  selectedIndex,
  onItemClick,
}: SuggestionMenuProps<DefaultReactSuggestionItem>) {
  const { t } = useI18n("editor")
  if (items.length === 0) {
    return (
      <div
        id="doc-reference-popover"
        role="menu"
        className="z-50 w-72 rounded-md border border-foreground/10 bg-popover p-1 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden"
      >
        <div className="flex items-center gap-2 px-2 py-2 text-muted-foreground">
          <Search className="size-4" />
          {t("noMatchDoc")}
        </div>
      </div>
    )
  }

  return (
    <div
      id="doc-reference-popover"
      role="menu"
      className="z-50 w-72 rounded-md border border-foreground/10 bg-popover p-1 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden"
    >
      {items.map((item, index) => {
        const isSelected = index === selectedIndex
        return (
          <button
            key={`${item.title}-${index}`}
            role="menuitem"
            type="button"
            aria-selected={isSelected}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onItemClick?.(item)}
            className={cn(
              "flex w-full cursor-pointer items-center gap-2 rounded px-2 py-2 text-left transition-colors",
              "hover:bg-accent/60 hover:text-accent-foreground",
              isSelected && "bg-accent text-accent-foreground"
            )}
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
              {item.icon}
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate font-medium leading-none">{item.title}</span>
              {item.subtext && (
                <span className="truncate text-xs leading-none text-muted-foreground">
                  {item.subtext}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}

interface DocReferenceControllerProps {
  currentDocId?: string
}

export function DocReferenceController({ currentDocId }: DocReferenceControllerProps) {
  const { t } = useI18n("common")
  const { t: tEditor } = useI18n("editor")
  const editor = useBlockNoteEditor(blocknoteSchema)

  const getItems = useCallback(
    async (query: string): Promise<DefaultReactSuggestionItem[]> => {
      const keyword = query.trim()
      const createTitle = truncate(keyword || t("unnamed"), MAX_TITLE_LENGTH)

      const createItem: DefaultReactSuggestionItem = {
        title: tEditor("createDocTitle", { title: createTitle }),
        subtext: tEditor("createDocSubtext"),
        icon: <FilePlus2 className="size-4" />,
        onItemClick: () => {
          void (async () => {
            const doc = await createDocument(keyword)
            editor.insertInlineContent([{ type: "docReference", props: { docId: doc.id } }])
          })()
        },
      }

      let docs: Document[]
      try {
        docs = keyword
          ? await docSearch(keyword, MAX_RESULTS)
          : await getRecentDocuments(MAX_RESULTS)
      } catch (err) {
        console.error("Failed to load documents for reference:", err)
        docs = []
      }

      const filteredDocs = currentDocId ? docs.filter((doc) => doc.id !== currentDocId) : docs

      const docItems: DefaultReactSuggestionItem[] = filteredDocs.map((doc) => {
        const title = truncate(doc.title || t("unnamed"), MAX_TITLE_LENGTH)
        return {
          title,
          subtext: tEditor("insertDocSubtext"),
          icon: <DocEmojiIcon emoji={doc.emoji} className="size-4" />,
          onItemClick: () => {
            editor.insertInlineContent([{ type: "docReference", props: { docId: doc.id } }])
          },
        }
      })

      return [createItem, ...docItems]
    },
    [editor, currentDocId, t, tEditor]
  )

  return (
    <SuggestionMenuController
      triggerCharacter={DOC_REFERENCE_TRIGGER}
      getItems={getItems}
      suggestionMenuComponent={DocReferencePopover}
    />
  )
}
