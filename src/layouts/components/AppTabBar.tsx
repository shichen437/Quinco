import { Files, FileText, NetworkIcon, PlusIcon, TrashIcon, XIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { getPageTitle, useTabStore, type PageType } from "@/stores/navigationStore"

const pageIconMap: Record<PageType, React.ElementType> = {
  "all-docs": Files,
  editor: FileText,
  trash: TrashIcon,
  graph: NetworkIcon,
}

function AppTabBar() {
  const { t } = useTranslation("common")
  const tabs = useTabStore((s) => s.tabs)
  const activeTabId = useTabStore((s) => s.activeTabId)
  const addTab = useTabStore((s) => s.addTab)
  const closeTab = useTabStore((s) => s.closeTab)
  const setActiveTab = useTabStore((s) => s.setActiveTab)

  const handleNewTab = () => {
    addTab("all-docs", getPageTitle("all-docs"))
  }

  const handleCloseTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    closeTab(id)
  }

  if (tabs.length === 0) return null

  return (
    <div className="flex items-center gap-0.5 overflow-x-auto px-2">
      {tabs.map((tab) => {
        const Icon = pageIconMap[tab.type]
        const isActive = tab.id === activeTabId

        return (
          <div
            key={tab.id}
            role="button"
            tabIndex={0}
            className={`group flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-sm transition-colors ${
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
            }`}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                setActiveTab(tab.id)
              }
            }}
          >
            <Icon className="size-3.5 shrink-0" />
            <span className="max-w-24 truncate">{tab.title}</span>
            <button
              type="button"
              className="ml-0.5 rounded-sm p-0.5 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
              onClick={(e) => handleCloseTab(e, tab.id)}
              aria-label={t("closeTab") ?? "关闭标签页"}
            >
              <XIcon className="size-3" />
            </button>
          </div>
        )
      })}

      <Button
        variant="ghost"
        size="icon-sm"
        className="ml-1 size-6 shrink-0"
        onClick={handleNewTab}
        aria-label={t("newTab") ?? "新建标签页"}
      >
        <PlusIcon className="size-3.5" />
      </Button>
    </div>
  )
}

export default AppTabBar
