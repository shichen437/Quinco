import { useState } from "react"

import { useTranslation } from "react-i18next"

import { getErrorMessage } from "@/api/tauri-bridge/helper"
import { createAndSwitchWorkspace, type Workspace } from "@/api/tauri-bridge/workspace"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface CreateWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onWorkspaceCreated: (workspace: Workspace) => void
}

export default function CreateWorkspaceDialog({
  open,
  onOpenChange,
  onWorkspaceCreated,
}: CreateWorkspaceDialogProps) {
  const { t } = useTranslation("home")
  const { t: tCommon } = useTranslation("common")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError(t("workspaceNameRequired"))
      return
    }

    setLoading(true)
    setError("")

    try {
      const workspace = await createAndSwitchWorkspace(name.trim())
      onWorkspaceCreated(workspace)
      setName("")
      onOpenChange(false)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setName("")
    setError("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">{t("createWorkspaceTitle")}</DialogTitle>
          <DialogDescription>{t("createWorkspaceDesc")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-2 py-2">
            <div className="space-y-2">
              <Input
                id="workspace-name"
                placeholder={t("workspaceNamePlaceholder")}
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError("")
                }}
                disabled={loading}
                autoFocus
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? t("creating") : tCommon("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
