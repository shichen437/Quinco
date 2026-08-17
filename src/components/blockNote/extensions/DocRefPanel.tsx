import type { MouseEvent } from "react"

import { AlignLeft, ExternalLink, Layout, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"

export type DocRefPanelMode = "inline" | "card"

interface DocRefPanelProps {
  mode: DocRefPanelMode
  disabled?: boolean
  onOpen: (e: MouseEvent) => void
  onSwitchInline: (e: MouseEvent) => void
  onSwitchCard: (e: MouseEvent) => void
  onDelete: (e: MouseEvent) => void
}

export function DocRefPanel({
  mode,
  disabled = false,
  onOpen,
  onSwitchInline,
  onSwitchCard,
  onDelete,
}: DocRefPanelProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border bg-popover p-2 text-popover-foreground shadow-md">
      <button
        className="rounded-md p-1.5 transition-colors hover:bg-accent hover:text-accent-foreground"
        title="打开文档"
        onClick={onOpen}
      >
        <ExternalLink size={16} />
      </button>

      <button
        className={cn(
          "rounded-md p-1.5 transition-colors",
          disabled
            ? "pointer-events-none opacity-40"
            : "hover:bg-accent hover:text-accent-foreground",
          mode === "inline" && "bg-accent text-accent-foreground"
        )}
        title="行内样式"
        onClick={onSwitchInline}
        disabled={disabled}
      >
        <AlignLeft size={16} />
      </button>
      <button
        className={cn(
          "rounded-md p-1.5 transition-colors",
          disabled
            ? "pointer-events-none opacity-40"
            : "hover:bg-accent hover:text-accent-foreground",
          mode === "card" && "bg-accent text-accent-foreground"
        )}
        title="卡片样式"
        onClick={onSwitchCard}
        disabled={disabled}
      >
        <Layout size={16} />
      </button>

      <button
        className={cn(
          "rounded-md p-1.5 transition-colors text-muted-foreground",
          disabled
            ? "pointer-events-none opacity-40"
            : "hover:bg-destructive/10 hover:text-destructive"
        )}
        title="删除引用"
        onClick={onDelete}
        disabled={disabled}
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}
