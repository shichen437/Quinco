import { Plus, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { useTabStore, type Tab } from "@/store/tabStore"

function TabItem({ tab, isActive }: { tab: Tab; isActive: boolean }) {
  const { setActiveTab, closeTab } = useTabStore()

  return (
    <div
      className={cn(
        "group flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-3 text-sm transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
      )}
      onClick={() => setActiveTab(tab.id)}
    >
      <span className="max-w-32 truncate">{tab.title}</span>
      <button
        type="button"
        className="flex size-4 shrink-0 items-center justify-center rounded-sm opacity-0 transition-opacity hover:bg-accent-foreground/10 group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation()
          closeTab(tab.id)
        }}
      >
        <X className="size-3" />
      </button>
    </div>
  )
}

function AppTabBar() {
  const { t } = useTranslation("sidebar")
  const { tabs, activeTabId, createTab } = useTabStore()

  return (
    <div className="flex h-8 items-center gap-1 overflow-x-auto scrollbar-none">
      {tabs.map((tab) => (
        <TabItem key={tab.id} tab={tab} isActive={tab.id === activeTabId} />
      ))}
      <button
        type="button"
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        onClick={() => createTab({ type: "all-docs", title: t("allDocs") })}
      >
        <Plus className="size-4" />
      </button>
    </div>
  )
}

export default AppTabBar
