import { useEffect, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

import { createDoc } from "@/api/doc"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useGlobalHotkeys } from "@/hooks/useGlobalHotkeys"
import { getStoreValue, STORE_KEYS } from "@/lib/quincoStore"
import AllDocsPage from "@/pages/all-docs/AllDocsPage"
import EditorPage from "@/pages/editor/EditorPage"
import GraphPage from "@/pages/graph/GraphPage"
import SettingsPage from "@/pages/settings/SettingsPage"
import TrashPage from "@/pages/trash/TrashPage"
import WelcomePage from "@/pages/welcome/WelcomePage"
import { useTabStore, type TabType } from "@/store/tabStore"

import AppHeader from "./components/AppHeader"
import AppSidebar from "./components/AppSidebar"
import QuickSearchDialog from "./components/QuickSearchDialog"

function TabContent() {
  const { tabs, activeTabId } = useTabStore()

  if (tabs.length === 0 || !activeTabId) {
    return <WelcomePage />
  }

  const activeTab = tabs.find((t) => t.id === activeTabId)
  if (!activeTab) {
    return <WelcomePage />
  }

  switch (activeTab.type) {
    case "all-docs":
      return <AllDocsPage />
    case "editor":
      return <EditorPage />
    case "trash":
      return <TrashPage />
    case "graph":
      return <GraphPage />
    default:
      return <WelcomePage />
  }
}

function HomePage() {
  const { t } = useTranslation(["sidebar", "common"])
  const activeTabId = useTabStore((s) => s.activeTabId)
  const openTab = useTabStore((s) => s.openTab)
  const [quickSearchOpen, setQuickSearchOpen] = useState(false)
  const restoredRef = useRef(false)

  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true

    getStoreValue<{
      type: TabType
      title: string
      docId?: string
      tagId?: number
    }>(STORE_KEYS.lastTab).then((lastTab) => {
      if (lastTab && lastTab.title) {
        openTab(lastTab)
      }
    })
  }, [openTab])

  useGlobalHotkeys({
    "ctrl+shift+s": () => setQuickSearchOpen(true),
    "ctrl+shift+n": async () => {
      const doc = await createDoc()
      openTab({ type: "editor", title: doc.title || t("common:untitled"), docId: doc.id })
    },
    "ctrl+shift+a": () => openTab({ type: "all-docs", title: t("sidebar:allDocs") }),
    "ctrl+shift+g": () => openTab({ type: "graph", title: t("sidebar:graph") }),
  })

  return (
    <SidebarProvider>
      <AppSidebar onQuickSearchOpenChange={setQuickSearchOpen} />
      <SidebarInset>
        <AppHeader />
        <div className="flex flex-1">
          <TabContent key={activeTabId} />
        </div>
      </SidebarInset>
      <SettingsPage />
      <QuickSearchDialog open={quickSearchOpen} onOpenChange={setQuickSearchOpen} />
    </SidebarProvider>
  )
}

export default HomePage
