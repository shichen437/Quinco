import { useState } from "react"

import { useTranslation } from "react-i18next"

import { deleteWorkspace, type Workspace } from "@/api/workspace"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface WorkspaceDeleteDialogProps {
  workspace: Workspace | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: (workspace: Workspace) => void
}

function WorkspaceDeleteDialog({
  workspace,
  open,
  onOpenChange,
  onDeleted,
}: WorkspaceDeleteDialogProps) {
  const [confirmName, setConfirmName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation(["settings", "common"])

  const matched = workspace != null && confirmName === workspace.name

  const reset = () => {
    setConfirmName("")
    setError(null)
    setSubmitting(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!workspace || !matched || submitting) return

    setSubmitting(true)
    setError(null)
    try {
      await deleteWorkspace(workspace.id)
      reset()
      onOpenChange(false)
      onDeleted(workspace)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("settings:workspaceDelete.title")}</DialogTitle>
          <DialogDescription>
            {t("settings:workspaceDelete.description", { name: workspace?.name ?? "" })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <Input
            autoFocus
            value={confirmName}
            placeholder={workspace?.name ?? ""}
            onChange={(event) => setConfirmName(event.target.value)}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>
              {t("common:cancel")}
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={!matched || submitting}>
              {submitting ? t("settings:workspaceDelete.deleting") : t("common:delete")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default WorkspaceDeleteDialog
