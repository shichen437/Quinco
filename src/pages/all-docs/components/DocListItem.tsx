import { useTranslation } from "react-i18next"

import DocIcon from "@/components/common/DocIcon"

interface DocListItemProps {
  title: string
  emoji: string
  updatedAt: string
  onClick: () => void
}

function formatTime(dateStr: string, locale: string): string {
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

export default function DocListItem({ title, emoji, updatedAt, onClick }: DocListItemProps) {
  const { i18n, t } = useTranslation(["common"])
  const locale = i18n.language === "zh" ? "zh-CN" : "en-US"

  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-md px-4 py-2.5 text-left hover:bg-accent"
      onClick={onClick}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <DocIcon emoji={emoji} className="text-muted-foreground" />
        <span className="truncate text-sm">{title || t("common:untitled")}</span>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">
        {formatTime(updatedAt, locale)}
      </span>
    </button>
  )
}
