import { useCallback } from "react"

import { ChevronLeftIcon, ChevronRightIcon, Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"

import { GradientIcon } from "@/components/common/GradientIcon"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import AppTabBar from "@/layouts/components/AppTabBar"
import { useAiChatStore } from "@/stores/aiChatStore"
import { useTabStore } from "@/stores/navigationStore"
import { useSettingsStore } from "@/stores/settingsStore"

function AppHeader() {
  const { t } = useTranslation("common")
  const activeTabId = useTabStore((s) => s.activeTabId)
  const goBack = useTabStore((s) => s.goBack)
  const goForward = useTabStore((s) => s.goForward)
  const aiEnabled = useSettingsStore((s) => s.config?.aiEnabled ?? false)
  const aiChatOpen = useAiChatStore((s) => s.open)
  const toggleAiChat = useAiChatStore((s) => s.toggle)

  const canGoBack = useTabStore((s) => s.canGoBack)
  const canGoForward = useTabStore((s) => s.canGoForward)
  useTabStore((s) => s.tabHistories)

  const handleGoBack = useCallback(() => {
    if (activeTabId) {
      goBack()
    }
  }, [activeTabId, goBack])

  const handleGoForward = useCallback(() => {
    if (activeTabId) {
      goForward()
    }
  }, [activeTabId, goForward])

  const backEnabled = activeTabId != null && canGoBack(activeTabId)
  const forwardEnabled = activeTabId != null && canGoForward(activeTabId)

  return (
    <header className="sticky top-0 z-50 flex h-12 shrink-0 items-center justify-between border-b bg-background px-2">
      <div className="flex items-center overflow-hidden">
        <SidebarTrigger />
        <AppTabBar />
      </div>

      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon-sm" disabled={!backEnabled} onClick={handleGoBack}>
                <ChevronLeftIcon />
                <span className="sr-only">{t("goBack")}</span>
              </Button>
            }
          />
          <TooltipContent>{t("goBack")}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={!forwardEnabled}
                onClick={handleGoForward}
              >
                <ChevronRightIcon />
                <span className="sr-only">{t("goForward")}</span>
              </Button>
            }
          />
          <TooltipContent>{t("goForward")}</TooltipContent>
        </Tooltip>

        {aiEnabled && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-expanded={aiChatOpen}
                  onClick={toggleAiChat}
                >
                  <GradientIcon icon={Sparkles} />
                  <span className="sr-only">{t("aiAssistant")}</span>
                </Button>
              }
            />
            <TooltipContent>{t("aiAssistant")}</TooltipContent>
          </Tooltip>
        )}
      </div>
    </header>
  )
}

export default AppHeader
