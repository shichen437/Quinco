import { useCallback, useEffect, useState } from "react"

import { Check, ChevronsUpDown, Database, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"

import { listWorkspaces, switchWorkspace, type Workspace } from "@/api/workspace"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { SidebarMenuButton } from "@/components/ui/sidebar"
import { useFavoriteStore } from "@/store/favoriteStore"
import { useTabStore } from "@/store/tabStore"
import { useTagStore } from "@/store/tagStore"

import WorkspaceCreate from "./WorkspaceCreate"

function WorkspaceSwitcher() {
  const { t } = useTranslation("workspace")
  const closeAllTabs = useTabStore((state) => state.closeAllTabs)
  const loadFavorites = useFavoriteStore((state) => state.loadFavorites)
  const loadTags = useTagStore((state) => state.loadTags)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [switching, setSwitching] = useState(false)

  const current = workspaces.find((workspace) => workspace.isCurrent === 1)

  const loadWorkspaces = useCallback(async () => {
    try {
      setWorkspaces(await listWorkspaces())
    } catch (err) {
      console.error(t("loadError"), err)
    }
  }, [])

  useEffect(() => {
    loadWorkspaces()
  }, [loadWorkspaces])

  const handleSwitch = async (workspace: Workspace) => {
    if (switching) return
    if (workspace.id === current?.id) {
      setPopoverOpen(false)
      return
    }

    setSwitching(true)
    try {
      await switchWorkspace(workspace.id)
      closeAllTabs()
      loadFavorites()
      loadTags()
      setPopoverOpen(false)
      await loadWorkspaces()
    } catch (err) {
      console.error(t("switchError"), err)
    } finally {
      setSwitching(false)
    }
  }

  const handleCreated = () => {
    // 新建的工作区会成为当前工作区，需要清空已打开的标签页并刷新收藏和标签
    closeAllTabs()
    loadFavorites()
    loadTags()
    loadWorkspaces()
  }

  return (
    <>
      <Popover
        open={popoverOpen}
        onOpenChange={(next) => {
          setPopoverOpen(next)
          // 打开时刷新列表，避免在设置中删除/切换空间后展示过期数据
          if (next) loadWorkspaces()
        }}
      >
        <PopoverTrigger render={<SidebarMenuButton tooltip={current?.name ?? t("workspace")} />}>
          <Database />
          <span>{current?.name ?? t("noWorkspace")}</span>
          <ChevronsUpDown className="ml-auto" />
        </PopoverTrigger>
        <PopoverContent align="start" sideOffset={8} className="w-56 gap-1 p-1">
          <div className="flex flex-col">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                type="button"
                disabled={switching}
                onClick={() => handleSwitch(workspace)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
              >
                <span className="flex-1 truncate text-left">{workspace.name}</span>
                {workspace.isCurrent === 1 && <Check className="size-4 shrink-0 text-primary" />}
              </button>
            ))}
          </div>
          <Separator />
          <button
            type="button"
            onClick={() => {
              setPopoverOpen(false)
              setDialogOpen(true)
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Plus className="size-4" />
            {t("createWorkspace")}
          </button>
        </PopoverContent>
      </Popover>
      <WorkspaceCreate open={dialogOpen} onOpenChange={setDialogOpen} onCreated={handleCreated} />
    </>
  )
}

export default WorkspaceSwitcher
