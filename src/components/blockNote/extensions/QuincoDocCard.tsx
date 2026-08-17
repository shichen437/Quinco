import { useEffect, useRef, useState } from "react"

import type { BlockNoteEditor } from "@blocknote/core"
import { createReactBlockSpec } from "@blocknote/react"

import DocIcon from "@/components/common/DocIcon"
import { truncateAdvanced } from "@/lib/str"
import { cn } from "@/lib/utils"
import { useSettingsStore } from "@/store/settingsStore"
import { useTabStore } from "@/store/tabStore"

import { DocRefPanel } from "./DocRefPanel"
import { buildDocUrl, parseDocId, useDocTitle } from "./QuincoDoc"

function formatUpdatedAt(dateStr: string, locale: string): string {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  const now = new Date()
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  if (isToday) {
    return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
  }

  return date.toLocaleDateString(locale, { month: "2-digit", day: "2-digit" })
}

export const QuincoDocCard = createReactBlockSpec(
  {
    type: "quincoDocCard",
    propSchema: {
      docId: { default: "" },
    },
    content: "none",
  },
  {
    render: (props) => {
      const id = parseDocId(props.block.props.docId)
      const { title, emoji, updatedAt, notFound } = useDocTitle(id)
      const openTab = useTabStore((s) => s.openTab)
      const lang = useSettingsStore((s) => s.lang)
      const locale = lang === "zh" ? "zh-CN" : "en-US"
      const [showPanel, setShowPanel] = useState(false)
      const panelRef = useRef<HTMLDivElement>(null)
      const cardRef = useRef<HTMLDivElement>(null)

      useEffect(() => {
        if (!showPanel) return
        const handler = (e: MouseEvent) => {
          if (
            panelRef.current &&
            !panelRef.current.contains(e.target as Node) &&
            cardRef.current &&
            !cardRef.current.contains(e.target as Node)
          ) {
            setShowPanel(false)
            props.editor.focus()
          }
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
      }, [showPanel, props.editor])

      const handleCardClick = () => {
        setShowPanel((prev) => !prev)
      }

      const handleCardDoubleClick = () => {
        if (!id || notFound) return
        setShowPanel(false)
        openTab({ type: "editor", title: title || "未命名", docId: id })
      }

      const handleOpen = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!id || notFound) return
        openTab({ type: "editor", title: title || "未命名", docId: id })
        setShowPanel(false)
      }

      const handleSwitchToInline = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!id) return
        convertCardToInline(props.editor, props.block as any, id)
        setShowPanel(false)
      }

      const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation()
        editorRemoveBlock(props.editor, (props.block as any).id)
        setShowPanel(false)
      }

      return (
        <div
          ref={cardRef}
          className="group w-full relative my-2 cursor-pointer select-none rounded-lg border bg-card p-2.5 shadow-sm transition-shadow hover:shadow-md"
          contentEditable={false}
          onClick={handleCardClick}
          onDoubleClick={handleCardDoubleClick}
        >
          {showPanel && (
            <div
              ref={panelRef}
              className="absolute -top-14 left-0 z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <DocRefPanel
                mode="card"
                disabled={!props.editor.isEditable}
                onOpen={handleOpen}
                onSwitchInline={handleSwitchToInline}
                onSwitchCard={() => {}}
                onDelete={handleDelete}
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <DocIcon emoji={emoji} className="size-5 text-lg" />
            <span
              className={cn(
                "text-sm font-medium",
                notFound && "text-muted-foreground line-through"
              )}
            >
              {truncateAdvanced(title ?? "", { maxLength: 36, wordBoundary: true }) ??
                (id ? "加载中…" : "无效引用")}
            </span>
            {updatedAt && (
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                {formatUpdatedAt(updatedAt, locale)}
              </span>
            )}
          </div>
        </div>
      )
    },
  }
)

function editorRemoveBlock(editor: BlockNoteEditor<any, any, any>, blockId: string) {
  editor.removeBlocks([blockId])
}

function convertCardToInline(
  editor: BlockNoteEditor<any, any, any>,
  block: { id: string },
  docId: string
) {
  editor.replaceBlocks(
    [block.id],
    [
      {
        type: "paragraph",
        content: [{ type: "quincoDoc", props: { docId: buildDocUrl(docId) } }],
      } as any,
    ]
  )
}
