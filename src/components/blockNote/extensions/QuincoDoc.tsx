import { useEffect, useRef, useState, type MouseEvent } from "react"

import type { BlockNoteEditor } from "@blocknote/core"
import {
  createReactInlineContentSpec,
  type DefaultReactSuggestionItem,
  type SuggestionMenuProps,
} from "@blocknote/react"
import { FilePlus2 } from "lucide-react"

import { createDoc, getDoc, searchReferenceCandidates, updateDocTitle } from "@/api/doc"
import DocIcon from "@/components/common/DocIcon"
import { truncateAdvanced } from "@/lib/str"
import { cn } from "@/lib/utils"
import { useTabStore } from "@/store/tabStore"

import { DocRefPanel } from "./DocRefPanel"

const DOC_PROTOCOL_PREFIX = "quinco://localhost/doc/"

export function buildDocUrl(id: string) {
  return `${DOC_PROTOCOL_PREFIX}${id}`
}

export function parseDocId(url: string) {
  if (!url.startsWith(DOC_PROTOCOL_PREFIX)) return null
  const id = url.slice(DOC_PROTOCOL_PREFIX.length).split(/[/?#]/)[0]
  return id || null
}

// 文档信息缓存，多个引用指向同一文档时避免重复查询。
const docInfoCache = new Map<string, { title: string; emoji: string; updatedAt: string }>()

interface DocTitleState {
  title: string | null
  emoji: string
  updatedAt: string | null
  notFound: boolean
}

export function useDocTitle(id: string | null): DocTitleState {
  const [state, setState] = useState<DocTitleState>(() => {
    const cached = id ? docInfoCache.get(id) : undefined
    return {
      title: cached?.title ?? null,
      emoji: cached?.emoji ?? "",
      updatedAt: cached?.updatedAt ?? null,
      notFound: false,
    }
  })

  useEffect(() => {
    if (!id) return
    let cancelled = false
    getDoc(id)
      .then((doc) => {
        const docTitle = doc.title || "未命名"
        const docEmoji = doc.emoji || ""
        const docUpdatedAt = doc.updatedAt || ""
        docInfoCache.set(id, { title: docTitle, emoji: docEmoji, updatedAt: docUpdatedAt })
        if (!cancelled)
          setState({ title: docTitle, emoji: docEmoji, updatedAt: docUpdatedAt, notFound: false })
      })
      .catch(() => {
        if (!cancelled) setState((prev) => ({ ...prev, title: "文档已删除", notFound: true }))
      })
    return () => {
      cancelled = true
    }
  }, [id])

  return state
}

export const QuincoDoc = createReactInlineContentSpec(
  {
    type: "quincoDoc",
    propSchema: {
      docId: { default: "" },
    },
    content: "none",
  },
  {
    render: (props) => {
      const docUrl = props.inlineContent.props.docId
      const id = parseDocId(docUrl)
      const { title, emoji, notFound } = useDocTitle(id)
      const openTab = useTabStore((s) => s.openTab)
      const [hovered, setHovered] = useState(false)
      const containerRef = useRef<HTMLSpanElement>(null)
      const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

      const handleMouseEnter = () => {
        if (hideTimer.current) {
          clearTimeout(hideTimer.current)
          hideTimer.current = null
        }
        setHovered(true)
      }

      const handleMouseLeave = () => {
        hideTimer.current = setTimeout(() => {
          setHovered(false)
          hideTimer.current = null
        }, 250)
      }

      const handleClick = (event: MouseEvent<HTMLSpanElement>) => {
        if (!id || notFound) return
        event.preventDefault()
        event.stopPropagation()
        openTab({ type: "editor", title: title || "未命名", docId: id })
      }

      const handleSwitchToCard = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!docUrl) return
        convertInlineToCard(props.editor, docUrl)
        setHovered(false)
      }

      const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!docUrl) return
        removeInlineDocRef(props.editor, docUrl)
        setHovered(false)
      }

      return (
        <span
          ref={containerRef}
          className="relative inline-block"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {hovered && (
            <span
              className="absolute bottom-full left-0 z-50 mb-1 whitespace-nowrap"
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <DocRefPanel
                mode="inline"
                onOpen={handleClick as unknown as (e: React.MouseEvent) => void}
                onSwitchInline={() => {}}
                onSwitchCard={handleSwitchToCard}
                onDelete={handleDelete}
              />
            </span>
          )}

          <span
            className={cn(
              "inline-flex items-center gap-0.5 align-baseline",
              id && !notFound && "cursor-pointer hover:underline"
            )}
            onClick={handleClick}
          >
            <DocIcon emoji={emoji} className="size-3.75 text-[15px]" />
            {truncateAdvanced(title ?? "", { maxLength: 36, wordBoundary: true }) ??
              (id ? "加载中…" : "无效引用")}
          </span>
        </span>
      )
    },
  }
)

function insertDocReference(editor: BlockNoteEditor<any, any, any>, docId: string) {
  editor.insertInlineContent([{ type: "quincoDoc", props: { docId: buildDocUrl(docId) } }, " "])
}

/** 从所在块中移除内联 quincoDoc 引用。 */
function removeInlineDocRef(editor: BlockNoteEditor<any, any, any>, docUrl: string) {
  const blocks = editor.document
  for (const block of blocks) {
    const content = (block as any).content
    if (!content || typeof content === "string" || !Array.isArray(content)) continue

    const hasQuincoDoc = content.some(
      (c: any) => c.type === "quincoDoc" && c.props?.docId === docUrl
    )
    if (!hasQuincoDoc) continue

    const filteredContent = content.filter(
      (c: any) => c.type !== "quincoDoc" || c.props?.docId !== docUrl
    )

    const hasMeaningfulContent = filteredContent.some((c: any) => {
      if (c.type === "text" && c.text && c.text.trim().length > 0) return true
      if (c.type !== "text") return true
      return false
    })

    if (hasMeaningfulContent) {
      editor.updateBlock((block as any).id, { content: filteredContent } as any)
    } else {
      editor.removeBlocks([(block as any).id])
    }
    break
  }
}

function convertInlineToCard(editor: BlockNoteEditor<any, any, any>, docUrl: string) {
  const blocks = editor.document
  for (const block of blocks) {
    const content = (block as any).content
    if (!content || typeof content === "string" || !Array.isArray(content)) continue

    const hasQuincoDoc = content.some(
      (c: any) => c.type === "quincoDoc" && c.props?.docId === docUrl
    )
    if (!hasQuincoDoc) continue

    const meaningfulItems = content.filter((c: any) => {
      if (c.type === "quincoDoc") return true
      if (c.type === "text" && c.text && c.text.trim().length > 0) return true
      if (c.type !== "text") return true
      return false
    })

    const cardBlock = {
      type: "quincoDocCard",
      props: { docId: docUrl },
    } as any

    if (meaningfulItems.length === 1 && meaningfulItems[0].type === "quincoDoc") {
      editor.replaceBlocks([(block as any).id], [cardBlock])
    } else {
      const filteredContent = content.filter(
        (c: any) => c.type !== "quincoDoc" || c.props?.docId !== docUrl
      )
      editor.insertBlocks([cardBlock], (block as any).id, "after")
      editor.updateBlock((block as any).id, { content: filteredContent } as any)
    }
    break
  }
}

export async function getDocReferenceMenuItems(
  editor: BlockNoteEditor<any, any, any>,
  query: string,
  currentDocId?: string
): Promise<DefaultReactSuggestionItem[]> {
  const keyword = query.trim()

  const candidates = await searchReferenceCandidates(keyword, 5, currentDocId)

  const items: DefaultReactSuggestionItem[] = candidates.map((doc) => ({
    title: doc.title || "未命名",
    icon: <DocIcon emoji={doc.emoji} className="size-4 text-base" />,
    onItemClick: () => insertDocReference(editor, doc.id),
  }))

  items.push({
    title: `创建「${keyword || "未命名"}」文档`,
    icon: <FilePlus2 size={16} />,
    onItemClick: async () => {
      try {
        const doc = await createDoc()
        if (keyword) {
          await updateDocTitle(doc.id, keyword)
        }
        insertDocReference(editor, doc.id)
      } catch (error) {
        console.error("创建引用文档失败", error)
      }
    },
  })

  return items
}

export function DocReferenceMenu({
  items,
  loadingState,
  selectedIndex,
  onItemClick,
}: SuggestionMenuProps<DefaultReactSuggestionItem>) {
  const selectedRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest" })
  }, [selectedIndex])

  if (loadingState === "loading-initial") return null

  return (
    <div className="min-w-60 max-w-80 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
      {items.map((item, index) => (
        <div
          key={index}
          ref={index === selectedIndex ? selectedRef : undefined}
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
            index === selectedIndex && "bg-accent text-accent-foreground"
          )}
          onClick={() => onItemClick?.(item)}
        >
          {item.icon}
          <span className="truncate">{item.title}</span>
        </div>
      ))}
      {loadingState === "loading" && (
        <div className="px-2 py-1.5 text-sm text-muted-foreground">加载中…</div>
      )}
    </div>
  )
}
