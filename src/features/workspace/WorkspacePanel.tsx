import { useEffect, useRef, useState } from "react"

import { Check, ChevronsUpDown, Database, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"

import { getWorkspaces, type Workspace } from "@/api/tauri-bridge/workspace"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useWorkspaceStore } from "@/stores/workspaceStore"

import CreateWorkspaceDialog from "./CreateWorkspaceDialog"

interface WorkspacePanelProps {
  onWorkspaceChange?: (workspace: Workspace) => void
}

export default function WorkspacePanel({ onWorkspaceChange }: WorkspacePanelProps) {
  const { t } = useTranslation("home")
  const [open, setOpen] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace)
  const currentWid = useWorkspaceStore((s) => s.currentWid)
  const switchTo = useWorkspaceStore((s) => s.switchTo)

  const loadWorkspaces = async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const allWorkspaces = await getWorkspaces()
      setWorkspaces(allWorkspaces)
    } catch (error) {
      console.error("Failed to load workspaces:", error)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    loadWorkspaces(true)
  }, [])

  const prevWidRef = useRef<number | null>(null)
  useEffect(() => {
    if (prevWidRef.current !== null && prevWidRef.current !== currentWid) {
      loadWorkspaces()
    }
    prevWidRef.current = currentWid
  }, [currentWid])

  const handleSwitchWorkspace = async (workspace: Workspace) => {
    try {
      await switchTo(workspace.id)
      setOpen(false)
      await loadWorkspaces()
      onWorkspaceChange?.(workspace)
    } catch (error) {
      console.error("Failed to switch workspace:", error)
    }
  }

  const handleWorkspaceCreated = (workspace: Workspace) => {
    useWorkspaceStore.setState({
      currentWid: workspace.id,
      currentWorkspace: workspace,
    })
    loadWorkspaces()
    onWorkspaceChange?.(workspace)
  }

  if (loading) {
    return (
      <div className="flex h-8 items-center gap-2 px-2 text-muted-foreground">
        <Database className="size-4 shrink-0" />
        <span className="truncate text-sm">{t("loading")}</span>
      </div>
    )
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className="w-full">
          <div className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-sm text-sidebar-foreground ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground">
            <Database className="size-4 shrink-0" />
            <span className="truncate flex-1 text-left">
              {currentWorkspace?.name || t("selectWorkspace")}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-50 ml-auto" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder={t("searchWorkspace")} />
            <CommandList>
              <CommandEmpty>{t("noWorkspace")}</CommandEmpty>
              <CommandGroup>
                {workspaces.map((workspace) => (
                  <CommandItem
                    key={workspace.id}
                    value={workspace.name}
                    onSelect={() => handleSwitchWorkspace(workspace)}
                    className="flex items-center gap-2"
                  >
                    <Check
                      className={cn(
                        "size-4",
                        useWorkspaceStore.getState().currentWid === workspace.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <span className="truncate">{workspace.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false)
                    setShowCreateDialog(true)
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="size-4" />
                  <span>{t("createWorkspace")}</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <CreateWorkspaceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onWorkspaceCreated={handleWorkspaceCreated}
      />
    </>
  )
}
