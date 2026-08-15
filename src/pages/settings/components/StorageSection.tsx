import { useCallback, useEffect, useState } from "react"

import { Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { getDataDir, getStorageUsed } from "@/api/system"
import { listWorkspaces, type Workspace } from "@/api/workspace"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useFavoriteStore } from "@/store/favoriteStore"
import { useTabStore } from "@/store/tabStore"
import { useTagStore } from "@/store/tagStore"

import SectionShell from "./common/SectionShell"
import SettingRow from "./common/SettingRow"
import WorkspaceDeleteDialog from "./dialog/WorkspaceDeleteDialog"

function StorageSection() {
  const { t } = useTranslation(["settings", "common"])
  const closeAllTabs = useTabStore((state) => state.closeAllTabs)
  const loadFavorites = useFavoriteStore((state) => state.loadFavorites)
  const loadTags = useTagStore((state) => state.loadTags)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [deleting, setDeleting] = useState<Workspace | null>(null)
  const [dataDir, setDataDir] = useState<string | null>(null)
  const [storageUsed, setStorageUsed] = useState<string | null>(null)

  const loadWorkspaces = useCallback(async () => {
    try {
      setWorkspaces(await listWorkspaces())
    } catch (err) {
      console.error(t("workspace:loadError"), err)
    }
  }, [])

  const loadStorage = useCallback(async () => {
    try {
      const [dir, used] = await Promise.all([getDataDir(), getStorageUsed()])
      setDataDir(dir)
      setStorageUsed(used)
    } catch (err) {
      console.error(t("workspace:loadError"), err)
    }
  }, [])

  useEffect(() => {
    loadWorkspaces()
    loadStorage()
  }, [loadWorkspaces, loadStorage])

  const handleDeleted = (workspace: Workspace) => {
    loadWorkspaces()
    loadStorage()
    if (workspace.isCurrent === 1) {
      closeAllTabs()
      loadFavorites()
      loadTags()
    }
  }

  return (
    <SectionShell title={t("sections.storage")}>
      <SettingRow
        label={t("storage.dataDir")}
        value={
          dataDir ? (
            <Tooltip>
              <TooltipTrigger
                render={<span className="block max-w-[320px] truncate">{dataDir}</span>}
              />
              <TooltipContent>{dataDir}</TooltipContent>
            </Tooltip>
          ) : (
            t("common:loadingMore")
          )
        }
      />
      <SettingRow label={t("storage.usedSpace")} value={storageUsed ?? t("common:calculating")} />
      <div>
        <h3 className="mb-2 text-sm font-medium">{t("storage.workspaces")}</h3>
        <div className="divide-y rounded-lg border">
          {workspaces.map((workspace) => (
            <div key={workspace.id} className="flex h-11 items-center justify-between px-4 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm">{workspace.name}</span>
                {workspace.isCurrent === 1 && (
                  <Badge variant="secondary">{t("storage.current")}</Badge>
                )}
              </div>
              {workspace.id !== 1 && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title={t("storage.deleteWorkspace")}
                  onClick={() => setDeleting(workspace)}
                >
                  <Trash2 className="text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
      <WorkspaceDeleteDialog
        workspace={deleting}
        open={deleting != null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        onDeleted={handleDeleted}
      />
    </SectionShell>
  )
}

export default StorageSection
