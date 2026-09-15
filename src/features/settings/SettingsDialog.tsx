import { useState } from "react"

import { Database, Info, Keyboard, SettingsIcon, Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

import AboutSection from "./components/AboutSection"
import AiSection from "./components/AiSection"
import GeneralSection from "./components/GeneralSection"
import ShortcutsSection from "./components/ShortcutsSection"
import StorageSection from "./components/StorageSection"

type SettingsTab = "general" | "storage" | "ai" | "about" | "shortcuts"

interface TabItem {
  id: SettingsTab
  label: string
  icon: React.ElementType
}

function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation("setting")
  const [activeTab, setActiveTab] = useState<SettingsTab>("general")

  const tabs: TabItem[] = [
    { id: "general", label: t("general"), icon: SettingsIcon },
    { id: "storage", label: t("storage"), icon: Database },
    { id: "ai", label: t("ai"), icon: Sparkles },
    { id: "shortcuts", label: t("shortcuts"), icon: Keyboard },
    { id: "about", label: t("about"), icon: Info },
  ]

  const handleClose = () => onOpenChange(false)

  const renderContent = () => {
    switch (activeTab) {
      case "general":
        return <GeneralSection />
      case "storage":
        return <StorageSection onClose={handleClose} />
      case "ai":
        return <AiSection />
      case "shortcuts":
        return <ShortcutsSection />
      case "about":
        return <AboutSection />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-150 w-200 max-w-[calc(100%-2rem)] gap-0 overflow-hidden p-0 sm:max-w-none"
      >
        <DialogTitle className="sr-only">{t("title")}</DialogTitle>

        {/* Sidebar */}
        <nav className="flex w-48 shrink-0 flex-col border-r bg-sidebar px-3 py-5">
          <div className="mb-5 px-2">
            <h2 className="text-sm font-medium">{t("title")}</h2>
          </div>
          <div className="flex flex-col gap-0.5">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={
                    "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors " +
                    (isActive
                      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground")
                  }
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Fixed header for consistent title position */}
          <div className="shrink-0 px-7 pb-4 pt-6">
            <h1 className="text-lg font-medium">{tabs.find((t) => t.id === activeTab)?.label}</h1>
            <Separator className="mt-4" />
          </div>

          {/* Scrollable content area */}
          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-7 pb-7">
            {renderContent()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SettingsDialog
