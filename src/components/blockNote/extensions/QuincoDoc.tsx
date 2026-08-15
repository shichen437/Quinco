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
import { cn } from "@/lib/utils"
import { useTabStore } from "@/store/tabStore"

const DOC_PROTOCOL_PREFIX = "quinco://localhost/doc/"

function buildDocUrl(id: string) {
  return `${DOC_PROTOCOL_PREFIX}${id}`
}

function parseDocId(url: string) {
  if (!url.startsWith(DOC_PROTOCOL_PREFIX)) return null
  const id = url.slice(DOC_PROTOCOL_PREFIX.length).split(/[/?#]/)[0]
  return id || null
}

// 文档标题缓存，多个引用指向同一文档时避免重复查询。
const docInfoCache = new Map<string, { title: string; emoji: string }>()

interface DocTitleState {
  title: string | null
  emoji: string
  notFound: boolean
}

function useDocTitle(id: string | null): DocTitleState {
  const [state, setState] = useState<DocTitleState>(() => {
    const cached = id ? docInfoCache.get(id) : undefined
    return { title: cached?.title ?? null, emoji: cached?.emoji ?? "", notFound: false }
  })

  useEffect(() => {
    if (!id) return
    let cancelled = false
    getDoc(id)
      .then((doc) => {
        const docTitle = doc.title || "未命名"
        const docEmoji = doc.emoji || ""
        docInfoCache.set(id, { title: docTitle, emoji: docEmoji })
        if (!cancelled) setState({ title: docTitle, emoji: docEmoji, notFound: false })
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
      const id = parseDocId(props.inlineContent.props.docId)
      const { title, emoji, notFound } = useDocTitle(id)
      const openTab = useTabStore((s) => s.openTab)

      const handleClick = (event: MouseEvent<HTMLSpanElement>) => {
        if (!id || notFound) return
        // 阻止事件冒泡到编辑器，避免触发光标定位/选中
        event.preventDefault()
        event.stopPropagation()
        openTab({ type: "editor", title: title || "未命名", docId: id })
      }

      return (
        <span
          className={cn(
            "inline-flex items-center gap-0.5 align-baseline",
            id && !notFound && "cursor-pointer hover:underline"
          )}
          onClick={handleClick}
        >
          <DocIcon emoji={emoji} className="size-[15px] text-[15px]" />
          {title ?? (id ? "加载中…" : "无效引用")}
        </span>
      )
    },
  }
)

function insertDocReference(editor: BlockNoteEditor<any, any, any>, docId: string) {
  editor.insertInlineContent([{ type: "quincoDoc", props: { docId: buildDocUrl(docId) } }, " "])
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
