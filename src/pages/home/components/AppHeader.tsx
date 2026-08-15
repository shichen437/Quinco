import { ArrowLeft, ArrowRight } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useNavigationStore } from "@/store/navigationStore"
import { useTabStore } from "@/store/tabStore"

import AppTabBar from "./AppTabBar"

function AppHeader() {
  const { t } = useTranslation("header")
  const activeTabId = useTabStore((s) => s.activeTabId)
  const history = useNavigationStore((s) => (activeTabId ? s.histories[activeTabId] : undefined))
  const goBack = useNavigationStore((s) => s.goBack)
  const goForward = useNavigationStore((s) => s.goForward)

  const canGoBack = (history?.backStack.length ?? 0) > 0
  const canGoForward = (history?.forwardStack.length ?? 0) > 0

  return (
    <header className="relative z-20 flex h-12 shrink-0 items-center gap-2 border-b px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <AppTabBar />
      </div>
      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={!canGoBack}
          onClick={goBack}
          title={t("back")}
        >
          <ArrowLeft />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={!canGoForward}
          onClick={goForward}
          title={t("forward")}
        >
          <ArrowRight />
        </Button>
      </div>
    </header>
  )
}

export default AppHeader
