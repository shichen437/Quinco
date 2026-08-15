import { RotateCcw, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import DocIcon from "@/components/common/DocIcon"
import { Button } from "@/components/ui/button"

interface TrashDocListItemProps {
  title: string
  emoji: string
  onClick: () => void
  onRestore: () => void
  onDelete: () => void
}

export default function TrashDocListItem({
  title,
  emoji,
  onClick,
  onRestore,
  onDelete,
}: TrashDocListItemProps) {
  const { t } = useTranslation(["common"])

  return (
    <div className="flex w-full items-center gap-3 rounded-md px-4 py-2 hover:bg-accent">
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        onClick={onClick}
      >
        <DocIcon emoji={emoji} className="text-muted-foreground" />
        <span className="truncate text-sm">{title || t("common:untitled")}</span>
      </button>
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon-sm" title={t("common:restore")} onClick={onRestore}>
          <RotateCcw className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          title={t("common:delete")}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  )
}
