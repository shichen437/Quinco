import { useEffect, useState } from "react"

import {
  ChevronRight,
  Clock,
  FilePlusCorner,
  Layers,
  Search,
  Settings,
  Star,
  Tag,
  Tags,
  Trash2,
  VectorSquare,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { quickSearchDocs, type DocListItem } from "@/api/doc"
import DocIcon from "@/components/common/DocIcon"
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
import { cn } from "@/lib/utils"
import { useFavoriteStore } from "@/store/favoriteStore"
import { useSettingsStore } from "@/store/settingsStore"
import { useTabStore } from "@/store/tabStore"
import { useTagStore } from "@/store/tagStore"

import WorkspaceSwitcher from "./workspace/WorkspaceSwitcher"

function CollapsibleSection({
  label,
  icon: Icon,
  onExpand,
  children,
}: {
  label: string
  icon: React.ElementType
  onExpand?: () => void
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const { state, isMobile } = useSidebar()

  if (state === "collapsed" && !isMobile) {
    return null
  }

  const handleToggle = () => {
    const next = !open
    setOpen(next)
    if (next) onExpand?.()
  }

  return (
    <SidebarGroup className="py-1 gap-0">
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        onClick={handleToggle}
      >
        <Icon className="size-3.5 shrink-0" />
        <span className="flex-1 text-left">{label}</span>
        <ChevronRight
          className={cn("size-3.5 shrink-0 transition-transform", open && "rotate-90")}
        />
      </button>
      {open && <SidebarGroupContent>{children}</SidebarGroupContent>}
    </SidebarGroup>
  )
}

function AppSidebar({
  onQuickSearchOpenChange,
}: {
  onQuickSearchOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation(["sidebar", "common"])
  const { openTab } = useTabStore()
  const openSettings = useSettingsStore((s) => s.openSettings)
  const favoriteDocs = useFavoriteStore((s) => s.favorites)
  const loadFavorites = useFavoriteStore((s) => s.loadFavorites)
  const tags = useTagStore((s) => s.tags)
  const loadTags = useTagStore((s) => s.loadTags)
  const [recentDocs, setRecentDocs] = useState<DocListItem[]>([])

  const loadRecentDocs = () => {
    quickSearchDocs("", 10)
      .then(setRecentDocs)
      .catch(() => {})
  }

  useEffect(() => {
    loadFavorites()
    loadTags()
  }, [loadFavorites, loadTags])

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <WorkspaceSwitcher />
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarSeparator className="mx-0" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={t("sidebar:quickSearch")}
              onClick={() => onQuickSearchOpenChange(true)}
            >
              <Search />
              <span>{t("sidebar:quickSearch")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={t("sidebar:createDoc")}
              onClick={async () => {
                const { createDoc } = await import("@/api/doc")
                const doc = await createDoc()
                openTab({ type: "editor", title: doc.title || t("common:untitled"), docId: doc.id })
              }}
            >
              <FilePlusCorner />
              <span>{t("sidebar:createDoc")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={t("sidebar:allDocs")}
              onClick={() => openTab({ type: "all-docs", title: t("sidebar:allDocs") })}
            >
              <Layers />
              <span>{t("sidebar:allDocs")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={t("sidebar:graph")}
              onClick={() => openTab({ type: "graph", title: t("sidebar:graph") })}
            >
              <VectorSquare />
              <span>{t("sidebar:graph")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <div className="space-y-0">
          <CollapsibleSection label={t("sidebar:favorites")} icon={Star} onExpand={loadFavorites}>
            <SidebarMenu>
              {favoriteDocs.length === 0 ? (
                <SidebarMenuItem className="px-2 py-1 text-xs text-sidebar-foreground/50">
                  {t("sidebar:noFavorites")}
                </SidebarMenuItem>
              ) : (
                favoriteDocs.map((doc) => (
                  <SidebarMenuItem key={doc.id}>
                    <SidebarMenuButton
                      tooltip={doc.title || t("common:untitled")}
                      onClick={() =>
                        openTab({
                          type: "editor",
                          title: doc.title || t("common:untitled"),
                          docId: doc.id,
                        })
                      }
                    >
                      <DocIcon emoji={doc.emoji} />
                      <span>{doc.title || t("common:untitled")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </CollapsibleSection>

          <CollapsibleSection label={t("sidebar:tags")} icon={Tags} onExpand={loadTags}>
            <SidebarMenu>
              {tags.length === 0 ? (
                <SidebarMenuItem className="px-2 py-1 text-xs text-sidebar-foreground/50">
                  {t("sidebar:noTags")}
                </SidebarMenuItem>
              ) : (
                tags.map((tag) => (
                  <SidebarMenuItem key={tag.id}>
                    <SidebarMenuButton
                      tooltip={tag.name}
                      onClick={() =>
                        openTab({ type: "all-docs", title: t("sidebar:allDocs"), tagId: tag.id })
                      }
                    >
                      <Tag />
                      <span>{tag.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </CollapsibleSection>

          <CollapsibleSection label={t("sidebar:recent")} icon={Clock} onExpand={loadRecentDocs}>
            <SidebarMenu>
              {recentDocs.length === 0 ? (
                <SidebarMenuItem className="px-2 py-1 text-xs text-sidebar-foreground/50">
                  {t("common:noContent")}
                </SidebarMenuItem>
              ) : (
                recentDocs.map((doc) => (
                  <SidebarMenuItem key={doc.id}>
                    <SidebarMenuButton
                      tooltip={doc.title || t("common:untitled")}
                      onClick={() =>
                        openTab({
                          type: "editor",
                          title: doc.title || t("common:untitled"),
                          docId: doc.id,
                        })
                      }
                    >
                      <DocIcon emoji={doc.emoji} />
                      <span>{doc.title || t("common:untitled")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </CollapsibleSection>
        </div>
      </SidebarContent>

      <div className="px-4">
        <SidebarSeparator className="w-full" />
      </div>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={t("sidebar:trash")}
              onClick={() => openTab({ type: "trash", title: t("sidebar:trash") })}
            >
              <Trash2 />
              <span>{t("sidebar:trash")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={t("sidebar:settings")} onClick={openSettings}>
              <Settings />
              <span>{t("sidebar:settings")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

export default AppSidebar
