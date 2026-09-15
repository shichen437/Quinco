import { AnimatePresence } from "motion/react"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/toast"
import AiChatPanel from "@/features/ai-chat/AiChatPanel"
import AllDocsPage from "@/features/all-docs/AllDocsPage"
import EditorPage from "@/features/editor/EditorPage"
import GraphPage from "@/features/graph/GraphPage"
import TrashPage from "@/features/trash/TrashPage"
import WelcomePage from "@/features/welcome/WelcomePage"
import AppHeader from "@/layouts/components/AppHeader"
import AppSidebar from "@/layouts/components/AppSidebar"
import { useAiChatStore } from "@/stores/aiChatStore"
import { useTabStore, type PageType } from "@/stores/navigationStore"

function PageContent({ type }: { type: PageType }) {
  const content = (() => {
    switch (type) {
      case "all-docs":
        return <AllDocsPage />
      case "editor":
        return <EditorPage />
      case "trash":
        return <TrashPage />
      case "graph":
        return <GraphPage />
    }
  })()

  return <div className="h-full overflow-y-auto">{content}</div>
}

function MainContent() {
  const tabs = useTabStore((s) => s.tabs)
  const activeTabId = useTabStore((s) => s.activeTabId)

  const activeTab = tabs.find((t) => t.id === activeTabId)

  if (!activeTab) {
    return <WelcomePage />
  }

  return (
    <main className="flex-1 overflow-hidden">
      <PageContent type={activeTab.type} />
    </main>
  )
}

function MainLayout() {
  const aiPanelOpen = useAiChatStore((s) => s.open)

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="h-screen overflow-hidden">
        <AppHeader />
        <MainContent />
      </SidebarInset>
      <Toaster timeout={7000} />
      <AnimatePresence>{aiPanelOpen && <AiChatPanel />}</AnimatePresence>
    </SidebarProvider>
  )
}

export default MainLayout
