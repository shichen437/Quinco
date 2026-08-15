import { create } from "zustand"

import { setStoreValue, STORE_KEYS } from "@/lib/quincoStore"

export type TabType = "all-docs" | "editor" | "trash" | "graph"

export interface Tab {
  id: string
  type: TabType
  title: string
  docId?: string
  tagId?: number
}

interface TabState {
  tabs: Tab[]
  activeTabId: string | null
  openTab: (tab: Omit<Tab, "id">) => void
  createTab: (tab: Omit<Tab, "id">) => void
  closeTab: (id: string) => void
  closeAllTabs: () => void
  setActiveTab: (id: string) => void
}

let tabCounter = 0

export const useTabStore = create<TabState>((set, get) => ({
  tabs: [],
  activeTabId: null,

  openTab: (tabData) => {
    const { tabs, activeTabId } = get()

    if (activeTabId) {
      const newTabs = tabs.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              type: tabData.type,
              title: tabData.title,
              docId: tabData.docId,
              tagId: tabData.tagId,
            }
          : t
      )
      set({ tabs: newTabs })
      return
    }

    const newTab: Tab = {
      ...tabData,
      id: `tab-${++tabCounter}`,
    }
    set({ tabs: [...tabs, newTab], activeTabId: newTab.id })
  },

  createTab: (tabData) => {
    const { tabs } = get()
    const newTab: Tab = {
      ...tabData,
      id: `tab-${++tabCounter}`,
    }
    set({ tabs: [...tabs, newTab], activeTabId: newTab.id })
  },

  closeTab: (id) => {
    const { tabs, activeTabId } = get()
    const index = tabs.findIndex((t) => t.id === id)
    const newTabs = tabs.filter((t) => t.id !== id)

    let newActiveId = activeTabId
    if (activeTabId === id) {
      if (newTabs.length === 0) {
        newActiveId = null
      } else if (index >= newTabs.length) {
        newActiveId = newTabs[newTabs.length - 1].id
      } else {
        newActiveId = newTabs[index].id
      }
    }

    set({ tabs: newTabs, activeTabId: newActiveId })
  },

  closeAllTabs: () => {
    set({ tabs: [], activeTabId: null })
  },

  setActiveTab: (id) => {
    set({ activeTabId: id })
  },
}))

let saveTimer: ReturnType<typeof setTimeout> | null = null

function saveLastTab(tab: Tab | null) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    if (tab) {
      setStoreValue(STORE_KEYS.lastTab, {
        type: tab.type,
        title: tab.title,
        docId: tab.docId,
        tagId: tab.tagId,
      })
    } else {
      setStoreValue(STORE_KEYS.lastTab, "")
    }
  }, 1000)
}

useTabStore.subscribe((state) => {
  const activeTab = state.tabs.find((t) => t.id === state.activeTabId) ?? null
  saveLastTab(activeTab)
})
