import { useTranslation } from "react-i18next"

import type { Document } from "@/api/tauri-bridge/document"
import DocEmojiIcon from "@/components/common/DocEmojiIcon"
import { truncate } from "@/lib/string"
import { formatRelativeTime } from "@/lib/time"

export interface DocListItemProps {
  doc: Document
  onClick: (doc: Document) => void
  maxLength?: number
  showTime?: boolean
}

export function DocListItem({ doc, onClick, maxLength = 24, showTime = true }: DocListItemProps) {
  const { t, i18n } = useTranslation("common")
  return (
    <div
      role="button"
      tabIndex={0}
      className="flex items-center gap-4 rounded-lg px-3 py-2.5 cursor-pointer transition-colors hover:bg-accent/50 focus:bg-accent/50 focus:outline-none"
      onClick={() => onClick(doc)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick(doc)
        }
      }}
    >
      <DocEmojiIcon emoji={doc.emoji} className="size-4 text-muted-foreground" />
      <span className="flex-1 truncate text-sm text-foreground">
        {truncate(doc.title || t("unnamed"), maxLength)}
      </span>
      {showTime && (
        <span className="w-24 shrink-0 text-right text-xs text-muted-foreground">
          {formatRelativeTime(doc.updated_at, i18n.language)}
        </span>
      )}
    </div>
  )
}
