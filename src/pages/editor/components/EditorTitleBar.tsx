import { useState } from "react"

import { Lock, LockOpen, MoreHorizontal, RotateCcw, Star, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import ConfirmDialog from "@/components/common/ConfirmDialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface EditorTitleBarProps {
  title: string
  isFavorite: boolean
  isLock: boolean
  isDelete: boolean
  onToggleFavorite: () => void
  onToggleLock: () => void
  onMoveToTrash: () => Promise<void>
  onTrashConfirmed: () => void
  onRestore: () => Promise<void>
  onRestoreConfirmed?: () => void
  onDeletePermanently: () => Promise<void>
}

function EditorTitleBar({
  title,
  isFavorite,
  isLock,
  isDelete,
  onToggleFavorite,
  onToggleLock,
  onMoveToTrash,
  onTrashConfirmed,
  onRestore,
  onRestoreConfirmed,
  onDeletePermanently,
}: EditorTitleBarProps) {
  const [trashConfirmOpen, setTrashConfirmOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false)
  const { t } = useTranslation("editor")

  return (
    <div className="sticky top-0 z-10 flex h-12 shrink-0 items-center bg-background px-6">
      <h2 className="flex-1 truncate text-sm">{title}</h2>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={onToggleFavorite}>
          <Star className={cn("size-4", isFavorite && "fill-yellow-400 text-yellow-400")} />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={onToggleLock}>
              {isLock ? <LockOpen className="size-4" /> : <Lock className="size-4" />}
              {isLock ? t("unlockDoc") : t("lockDoc")}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="mx-2" />
            {isDelete ? (
              <>
                <DropdownMenuItem onClick={() => setRestoreConfirmOpen(true)}>
                  <RotateCcw className="size-4" />
                  {t("restoreDoc")}
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => setDeleteConfirmOpen(true)}>
                  <Trash2 className="size-4" />
                  {t("deletePermanently")}
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem variant="destructive" onClick={() => setTrashConfirmOpen(true)}>
                <Trash2 className="size-4" />
                {t("moveToTrash")}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmDialog
        open={trashConfirmOpen}
        onOpenChange={setTrashConfirmOpen}
        title={t("moveToTrashTitle")}
        description={t("moveToTrashDesc", { title })}
        destructive
        onConfirm={onMoveToTrash}
        onSuccess={onTrashConfirmed}
      />

      <ConfirmDialog
        open={restoreConfirmOpen}
        onOpenChange={setRestoreConfirmOpen}
        title={t("restoreDocTitle")}
        description={t("restoreDocDesc", { title })}
        onConfirm={onRestore}
        onSuccess={onRestoreConfirmed}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={t("deletePermanentlyTitle")}
        description={t("deletePermanentlyDesc", { title })}
        destructive
        onConfirm={onDeletePermanently}
        onSuccess={onTrashConfirmed}
      />
    </div>
  )
}

export default EditorTitleBar
