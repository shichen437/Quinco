import { useState } from "react"

import { HistoryIcon, PlusIcon, XIcon } from "lucide-react"
import { motion } from "motion/react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { MessageScrollerProvider } from "@/components/ui/message-scroller"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useAiChatStore } from "@/stores/aiChatStore"

import { ChatInput } from "./components/ChatInput"
import { ChatMessages } from "./components/ChatMessages"
import { SessionList } from "./components/SessionList"

function AiChatPanel() {
  const { t } = useTranslation("home")
  const closePanel = useAiChatStore((s) => s.closePanel)
  const startNewSession = useAiChatStore((s) => s.startNewSession)
  const loading = useAiChatStore((s) => s.loading)
  const [historyOpen, setHistoryOpen] = useState(false)

  return (
    <motion.aside
      initial={{ x: "100%", opacity: 0.8 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0.8 }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l bg-background"
    >
      <div className="flex h-12 shrink-0 items-center justify-between border-b px-3">
        <h2 className="text-sm font-medium">{t("aiAssistant")}</h2>
        <div className="flex items-center gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={startNewSession}
            disabled={loading}
            title={t("newSession")}
          >
            <PlusIcon className="size-4" />
            <span className="sr-only">{t("newSession")}</span>
          </Button>
          <Popover open={historyOpen} onOpenChange={setHistoryOpen}>
            <PopoverTrigger
              render={
                <Button
                  size="icon-sm"
                  variant="ghost"
                  disabled={loading}
                  title={t("sessionHistory")}
                >
                  <HistoryIcon className="size-4" />
                  <span className="sr-only">{t("sessionHistory")}</span>
                </Button>
              }
            />
            <PopoverContent align="end" side="bottom" sideOffset={8} className="w-64 gap-0 p-1">
              <SessionList open={historyOpen} onSelect={() => setHistoryOpen(false)} />
            </PopoverContent>
          </Popover>
          <Button size="icon-sm" variant="ghost" onClick={closePanel} title={t("close")}>
            <XIcon className="size-4" />
            <span className="sr-only">{t("close")}</span>
          </Button>
        </div>
      </div>

      <MessageScrollerProvider>
        <div className="flex min-h-0 flex-1 flex-col">
          <ChatMessages />
        </div>
      </MessageScrollerProvider>

      <ChatInput />
    </motion.aside>
  )
}

export default AiChatPanel
