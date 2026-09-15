import { useEffect, useRef, useState } from "react"

import { Check, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"

import { getErrorMessage } from "@/api/tauri-bridge/helper"
import { getDiskUsage } from "@/api/tauri-bridge/system"
import { deleteWorkspace, getCurrentWorkspace, resetWorkspace } from "@/api/tauri-bridge/workspace"
import ConfirmDialog from "@/components/common/ConfirmDialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTabStore } from "@/stores/navigationStore"
import { useWorkspaceStore } from "@/stores/workspaceStore"

interface SettingRowProps {
  title: string
  description?: string
  inline?: boolean
  children?: React.ReactNode
}

function SettingRow({ title, description, inline, children }: SettingRowProps) {
  if (inline && children) {
    return (
      <div className="flex items-start justify-between gap-8 py-4 first:pt-2">
        <div className="min-w-0 flex-1">
          <Label className="text-sm">{title}</Label>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
        <div className="shrink-0 pt-0.5">{children}</div>
      </div>
    )
  }

  return (
    <div className="py-4 first:pt-2">
      <Label className="text-sm">{title}</Label>
      {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      {children && <div className="mt-2">{children}</div>}
    </div>
  )
}

function StorageSection({ onClose }: { onClose?: () => void }) {
  const { t } = useTranslation("setting")
  const [usedStorage, setUsedStorage] = useState<string>(t("loading"))
  const [workspaceName, setWorkspaceName] = useState<string>("")
  const [workspaceId, setWorkspaceId] = useState<number | null>(null)
  const [workspaceType, setWorkspaceType] = useState<string>("local")
  const [_loading, setLoading] = useState(true)
  const [editValue, setEditValue] = useState("")
  const [saving, setSaving] = useState(false)
  const [focused, setFocused] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const rename = useWorkspaceStore((s) => s.rename)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getDiskUsage()
      .then((info) => {
        if (!cancelled) {
          setUsedStorage(info.diskUsage.usedHuman)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setUsedStorage(t("fetchFailed"))
          console.error("Failed to get disk usage:", err)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    getCurrentWorkspace()
      .then((ws) => {
        if (!cancelled) {
          setWorkspaceName(ws.name)
          setEditValue(ws.name)
          setWorkspaceId(ws.id)
          setWorkspaceType(ws.type)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to get current workspace:", err)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const saveName = async () => {
    const trimmed = editValue.trim()
    if (!trimmed) {
      setError(t("workspaceNameRequired"))
      return
    }
    if (trimmed === workspaceName) {
      inputRef.current?.blur()
      return
    }
    if (workspaceId === null) return

    setSaving(true)
    setError(null)
    try {
      const ws = await rename(workspaceId, trimmed)
      setWorkspaceName(ws.name)
      setEditValue(ws.name)
      inputRef.current?.blur()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      saveName()
    } else if (e.key === "Escape") {
      setEditValue(workspaceName)
      setError(null)
    }
  }

  const handleReset = async (): Promise<void> => {
    if (workspaceId === null) return
    const ws = await resetWorkspace(workspaceId)
    useTabStore.getState().clearTabs()
    useTabStore.setState({ tabHistories: {} })
    setWorkspaceName(ws.name)
    setEditValue(ws.name)
    getDiskUsage()
      .then((info) => setUsedStorage(info.diskUsage.usedHuman))
      .catch(() => setUsedStorage(t("fetchFailed")))
  }

  const handleDelete = async (): Promise<void> => {
    if (workspaceId === null) return
    setDeleting(true)
    try {
      const ws = await deleteWorkspace(workspaceId)
      useTabStore.getState().clearTabs()
      useTabStore.setState({ tabHistories: {} })
      useWorkspaceStore.setState({
        currentWid: ws.id,
        currentWorkspace: ws,
      })
      onClose?.()
    } catch (err) {
      console.error("Failed to delete workspace:", err)
      setError(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="divide-y divide-border">
      <SettingRow title={t("workspace")} description={t("workspaceDesc")} inline>
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value)
              if (error) setError(null)
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false)
              if (editValue !== workspaceName) {
                setEditValue(workspaceName)
                setError(null)
              }
            }}
            disabled={saving}
            className="h-8 max-w-40 px-2.5 text-sm"
            aria-invalid={!!error}
            aria-label={t("workspaceName")}
          />
          {focused && (
            <button
              onMouseDown={(e) => {
                e.preventDefault()
                saveName()
              }}
              disabled={saving}
              className="flex size-8 shrink-0 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
              title={t("save")}
            >
              <Check className="size-4" />
            </button>
          )}
        </div>
      </SettingRow>
      {error && <p className="pb-2 text-xs text-destructive">{error}</p>}
      <SettingRow title={t("localStorage")} description={t("storageUsed", { used: usedStorage })} />
      <button
        type="button"
        onClick={() => setResetDialogOpen(true)}
        className="flex w-full cursor-pointer items-center justify-between border-none bg-transparent py-4 text-left transition-colors hover:bg-muted/50"
      >
        <div className="min-w-0 flex-1">
          <Label className="text-sm text-destructive">{t("resetWorkspace")}</Label>
          <p className="mt-1 text-xs text-muted-foreground">{t("resetWorkspaceDesc")}</p>
        </div>
        <ChevronRight className="ml-4 size-4 shrink-0 text-muted-foreground" />
      </button>
      <ConfirmDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        title={t("resetWorkspaceTitle")}
        description={t("resetWorkspaceConfirmDesc")}
        confirmText={t("resetWorkspace")}
        cancelText={t("cancel")}
        destructive
        confirmValue={workspaceName}
        confirmPlaceholder={t("inputWorkspaceName")}
        onConfirm={handleReset}
      />
      {workspaceType !== "demo" && (
        <>
          <button
            type="button"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={deleting}
            className="flex w-full cursor-pointer items-center justify-between border-none bg-transparent py-4 text-left transition-colors hover:bg-muted/50 disabled:opacity-50"
          >
            <div className="min-w-0 flex-1">
              <Label className="text-sm text-destructive">{t("deleteWorkspace")}</Label>
              <p className="mt-1 text-xs text-muted-foreground">{t("deleteWorkspaceDesc")}</p>
            </div>
            <ChevronRight className="ml-4 size-4 shrink-0 text-muted-foreground" />
          </button>
          <ConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            title={t("deleteWorkspaceTitle")}
            description={t("deleteWorkspaceConfirmDesc")}
            confirmText={t("deleteWorkspace")}
            cancelText={t("cancel")}
            destructive
            confirmValue={workspaceName}
            confirmPlaceholder={t("inputWorkspaceName")}
            onConfirm={handleDelete}
          />
        </>
      )}
    </div>
  )
}

export default StorageSection
