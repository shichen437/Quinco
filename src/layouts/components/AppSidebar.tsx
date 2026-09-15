import { useCallback, useEffect, useRef, useState } from "react"

import {
  ChevronDown,
  ClockIcon,
  FilePlusCorner,
  Files,
  NetworkIcon,
  SearchIcon,
  SettingsIcon,
  StarIcon,
  TagsIcon,
  Trash2,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { createDocument } from "@/api/tauri-bridge/document"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import SearchPanel, { type SearchPanelRef } from "@/features/search/SearchPanel"
import SettingsDialog from "@/features/settings/SettingsDialog"
import { SidebarFavorites, SidebarRecents, SidebarTags } from "@/features/sidebar/SidebarList"
import WorkspacePanel from "@/features/workspace/WorkspacePanel"
import { useFavoritesStore } from "@/stores/favoritesStore"
import { useTabStore, type PageType } from "@/stores/navigationStore"
import { useCurrentWid } from "@/stores/workspaceStore"

function CollapsibleSection({
  title,
  icon: Icon,
  children,
  collapsed,
  defaultOpen = false,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  collapsed: boolean
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <SidebarGroup>
        <CollapsibleTrigger className="flex w-full items-center text-foreground/70 justify-between rounded-md px-2 py-1 hover:bg-accent hover:text-accent-foreground">
          <span className="flex items-center gap-2">
            <Icon className="size-3.5" />
            {!collapsed && <span className="text-xs xl:text-sm">{title}</span>}
          </span>
          {!collapsed && (
            <ChevronDown
              className={`size-3.5 shrink-0 transition-transform duration-200 ${
                open ? "rotate-0" : "-rotate-90"
              }`}
            />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>{children}</SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

function FavoritesSection({ collapsed }: { collapsed: boolean }) {
  const { t } = useTranslation("sidebar")
  return (
    <CollapsibleSection title={t("favorites")} icon={StarIcon} collapsed={collapsed}>
      <SidebarMenu>
        <SidebarFavorites />
      </SidebarMenu>
    </CollapsibleSection>
  )
}

function TagsSection({ collapsed }: { collapsed: boolean }) {
  const { t } = useTranslation("sidebar")
  return (
    <CollapsibleSection title={t("tags")} icon={TagsIcon} collapsed={collapsed}>
      <SidebarMenu>
        <SidebarTags />
      </SidebarMenu>
    </CollapsibleSection>
  )
}

function RecentSection({ collapsed }: { collapsed: boolean }) {
  const { t } = useTranslation("sidebar")
  return (
    <CollapsibleSection title={t("recent")} icon={ClockIcon} collapsed={collapsed}>
      <SidebarMenu>
        <SidebarRecents />
      </SidebarMenu>
    </CollapsibleSection>
  )
}

function AppSidebar() {
  const { t } = useTranslation("sidebar")
  const { t: tCommon } = useTranslation("common")
  const { state } = useSidebar()
  const collapsed = state === "collapsed"

  const navigateActiveTab = useTabStore((s) => s.navigateActiveTab)
  const clearTabs = useTabStore((s) => s.clearTabs)
  const openDocInActiveTab = useTabStore((s) => s.openDocInActiveTab)
  const loadFavorites = useFavoritesStore((s) => s.loadFavorites)
  const [creating, setCreating] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const currentWid = useCurrentWid()
  const searchPanelRef = useRef<SearchPanelRef>(null)
  const creatingRef = useRef(false)
  creatingRef.current = creating

  useEffect(() => {
    if (currentWid !== null) {
      loadFavorites()
    }
  }, [loadFavorites, currentWid])

  const handleWorkspaceChange = () => {
    clearTabs()
  }

  const handleNavigate = useCallback((type: PageType) => {
    navigateActiveTab(type)
  }, [])

  const handleNewDocument = useCallback(async () => {
    if (creatingRef.current) return
    setCreating(true)
    try {
      const doc = await createDocument()
      openDocInActiveTab(doc.id, doc.title || tCommon("unnamed"))
    } catch (err) {
      console.error("Failed to create document:", err)
    } finally {
      setCreating(false)
    }
  }, [])

  const handleOpenSearch = useCallback(() => {
    searchPanelRef.current?.open()
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey && event.altKey)) return
      switch (event.code) {
        case "KeyK":
          event.preventDefault()
          handleOpenSearch()
          break
        case "KeyA":
          event.preventDefault()
          handleNavigate("all-docs")
          break
        case "KeyN":
          event.preventDefault()
          handleNewDocument()
          break
        case "KeyG":
          event.preventDefault()
          handleNavigate("graph")
          break
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleNavigate, handleNewDocument, handleOpenSearch])

  return (
    <Sidebar collapsible="icon">
      <SearchPanel ref={searchPanelRef} />
      <SidebarHeader>
        <div>
          <WorkspacePanel onWorkspaceChange={handleWorkspaceChange} />
        </div>
        {!collapsed && (
          <div className="px-2">
            <SidebarSeparator className="w-full" />
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={t("quickSearch")} onClick={handleOpenSearch}>
              <SearchIcon />
              {!collapsed && <span>{t("quickSearch")}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={t("allDocs")} onClick={() => handleNavigate("all-docs")}>
              <Files />
              {!collapsed && <span>{t("allDocs")}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={t("newDoc")}
              onClick={handleNewDocument}
              disabled={creating}
            >
              <FilePlusCorner />
              {!collapsed && <span>{creating ? t("creating") : t("newDoc")}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={t("graph")} onClick={() => handleNavigate("graph")}>
              <NetworkIcon />
              {!collapsed && <span>{t("graph")}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {!collapsed && (
        <div className="px-4">
          <SidebarSeparator className="w-full" />
        </div>
      )}

      {!collapsed ? (
        <SidebarContent className="**:data-[sidebar=group]:py-1 gap-1 pt-1">
          <FavoritesSection collapsed={false} />
          <TagsSection collapsed={false} />
          <RecentSection collapsed={false} />
        </SidebarContent>
      ) : (
        <div className="flex-1" />
      )}

      {!collapsed && (
        <div className="px-4">
          <SidebarSeparator className="w-full" />
        </div>
      )}

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={t("trash")} onClick={() => handleNavigate("trash")}>
              <Trash2 />
              {!collapsed && <span>{t("trash")}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={t("settings")} onClick={() => setSettingsOpen(true)}>
              <SettingsIcon />
              {!collapsed && <span>{t("settings")}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </Sidebar>
  )
}

export default AppSidebar
