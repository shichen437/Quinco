import { create } from "zustand"

import i18n from "@/i18n"
import { useSettingsStore, type TabSession } from "@/stores/settingsStore"

export type PageType = "all-docs" | "editor" | "trash" | "graph"

export interface Tab {
  id: string
  type: PageType
  title: string
  docId?: string
  emoji?: string
  tagId?: number
}

export interface HistoryEntry {
  type: PageType
  title: string
  docId?: string
  tagId?: number
}

interface TabHistory {
  entries: HistoryEntry[]
  currentIndex: number
}

interface NavigationState {
  tabs: Tab[]
  activeTabId: string | null
  tabHistories: Record<string, TabHistory>
  sessionRestored: boolean

  addTab: (type: PageType, title?: string, docId?: string) => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  navigateActiveTab: (type: PageType) => void
  clearTabs: () => void
  updateTabTitle: (id: string, title: string) => void
  updateTabDocId: (id: string, docId: string) => void
  openDocInActiveTab: (docId: string, title: string) => void
  openTagInActiveTab: (tagId: number) => void
  clearActiveTabTag: () => void

  goBack: () => void
  goForward: () => void

  canGoBack: (tabId: string) => boolean
  canGoForward: (tabId: string) => boolean
  getCurrentEntry: (tabId: string) => HistoryEntry | null
  removeDocFromHistory: (docId: string) => void

  exportSession: () => TabSession
  restoreFromSession: (session: TabSession) => boolean
  saveSession: () => Promise<void>
}

function createEmptyHistory(): TabHistory {
  return { entries: [], currentIndex: -1 }
}

function recordNavigation(
  state: NavigationState,
  tabId: string,
  entry: HistoryEntry
): Record<string, TabHistory> {
  const existing = state.tabHistories[tabId] ?? createEmptyHistory()
  const newEntries = existing.entries.slice(0, existing.currentIndex + 1)
  newEntries.push(entry)
  const trimmedEntries = newEntries.length > 50 ? newEntries.slice(-50) : newEntries
  const newIndex = trimmedEntries.length - 1

  return {
    ...state.tabHistories,
    [tabId]: { entries: trimmedEntries, currentIndex: newIndex },
  }
}

const pageTitleKeyMap: Record<PageType, string> = {
  "all-docs": "allDocs",
  editor: "unnamed",
  trash: "trash",
  graph: "graph",
}

export function getPageTitle(type: PageType): string {
  const key = pageTitleKeyMap[type]
  // editor uses common namespace; others use sidebar namespace
  const ns = type === "editor" ? "common" : "sidebar"
  const translated = ns === "common" ? i18n.t(key) : i18n.t(`${ns}:${key}`)
  return translated || key
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  tabHistories: {},
  sessionRestored: false,

  addTab: (type, title, docId) => {
    const id = `${type}-${Date.now()}`
    const entry: HistoryEntry = {
      type,
      title: title ?? getPageTitle(type),
      docId,
    }
    const newTab: Tab = { id, ...entry }

    if (type === "editor") {
      const state = get()
      const existingEmptyEditor = state.tabs.find((t) => t.type === "editor" && !t.docId)
      if (existingEmptyEditor) {
        set((s) => ({
          tabs: s.tabs.map((t) => (t.id === existingEmptyEditor.id ? { ...t, ...entry } : t)),
          activeTabId: existingEmptyEditor.id,
          tabHistories: recordNavigation(s, existingEmptyEditor.id, entry),
        }))
        return
      }
    }

    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: id,
      tabHistories: recordNavigation(state, id, entry),
    }))
  },

  closeTab: (id) => {
    const state = get()
    const tabIndex = state.tabs.findIndex((t) => t.id === id)
    if (tabIndex === -1) return

    const newHistories = { ...state.tabHistories }
    delete newHistories[id]

    const newTabs = state.tabs.filter((t) => t.id !== id)

    let newActiveTabId = state.activeTabId
    if (state.activeTabId === id) {
      if (newTabs.length === 0) {
        newActiveTabId = null
      } else {
        const newIndex = Math.max(0, tabIndex - 1)
        newActiveTabId = newTabs[newIndex]?.id ?? null
      }
    }

    set({ tabs: newTabs, activeTabId: newActiveTabId, tabHistories: newHistories })
  },

  setActiveTab: (id) => {
    set({ activeTabId: id })
  },

  clearTabs: () => {
    set({ tabs: [], activeTabId: null, tabHistories: {} })
  },

  navigateActiveTab: (type) => {
    const state = get()
    if (!state.activeTabId) {
      const id = `${type}-${Date.now()}`
      const entry: HistoryEntry = { type, title: getPageTitle(type) }
      const newTab: Tab = { id, ...entry }
      set((s) => ({
        tabs: [...s.tabs, newTab],
        activeTabId: id,
        tabHistories: recordNavigation(s, id, entry),
      }))
      return
    }

    const entry: HistoryEntry = { type, title: getPageTitle(type) }
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === s.activeTabId
          ? { ...t, type, title: getPageTitle(type), docId: undefined, tagId: undefined }
          : t
      ),
      tabHistories: recordNavigation(s, s.activeTabId!, entry),
    }))
  },

  updateTabTitle: (id, title) => {
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, title } : t)),
    }))
  },

  updateTabDocId: (id, docId) => {
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, docId } : t)),
    }))
  },

  openDocInActiveTab: (docId, title) => {
    const state = get()
    const entry: HistoryEntry = { type: "editor", title: title || "未命名", docId }

    if (state.activeTabId) {
      set((s) => ({
        tabs: s.tabs.map((t) =>
          t.id === s.activeTabId
            ? {
                ...t,
                type: "editor" as PageType,
                docId,
                title: title || "未命名",
                tagId: undefined,
              }
            : t
        ),
        tabHistories: recordNavigation(s, s.activeTabId!, entry),
      }))
      return
    }

    const id = `editor-${Date.now()}`
    const newTab: Tab = { id, type: "editor", title: title || "未命名", docId }
    set((s) => ({
      tabs: [...s.tabs, newTab],
      activeTabId: id,
      tabHistories: recordNavigation(s, id, entry),
    }))
  },

  openTagInActiveTab: (tagId) => {
    const state = get()

    // 已停留在“全部文档-标签视图-该标签”时视为无操作，不再重复记录历史
    const activeTab = state.activeTabId
      ? state.tabs.find((t) => t.id === state.activeTabId)
      : undefined
    if (activeTab?.type === "all-docs" && activeTab.tagId === tagId) return

    const entry: HistoryEntry = {
      type: "all-docs",
      title: getPageTitle("all-docs"),
      tagId,
    }

    if (state.activeTabId) {
      set((s) => ({
        tabs: s.tabs.map((t) =>
          t.id === s.activeTabId
            ? {
                ...t,
                type: "all-docs" as PageType,
                title: getPageTitle("all-docs"),
                docId: undefined,
                tagId,
              }
            : t
        ),
        tabHistories: recordNavigation(s, s.activeTabId!, entry),
      }))
      return
    }

    const id = `all-docs-${Date.now()}`
    const newTab: Tab = {
      id,
      type: "all-docs",
      title: getPageTitle("all-docs"),
      tagId,
    }
    set((s) => ({
      tabs: [...s.tabs, newTab],
      activeTabId: id,
      tabHistories: recordNavigation(s, id, entry),
    }))
  },

  clearActiveTabTag: () => {
    const state = get()
    if (!state.activeTabId) return
    const activeTab = state.tabs.find((t) => t.id === state.activeTabId)
    if (!activeTab?.tagId) return

    // 仅退出标签详情状态，属于页内局部视图切换，不写历史
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === s.activeTabId ? { ...t, tagId: undefined } : t)),
    }))
  },

  goBack: () => {
    const state = get()
    if (!state.activeTabId) return

    const tabHistory = state.tabHistories[state.activeTabId]
    if (!tabHistory || tabHistory.currentIndex <= 0) return

    const newIndex = tabHistory.currentIndex - 1
    const targetEntry = tabHistory.entries[newIndex]

    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === s.activeTabId
          ? {
              ...t,
              type: targetEntry.type,
              title: targetEntry.title,
              docId: targetEntry.docId,
              tagId: targetEntry.tagId,
            }
          : t
      ),
      tabHistories: {
        ...s.tabHistories,
        [s.activeTabId!]: { ...tabHistory, currentIndex: newIndex },
      },
    }))
  },

  goForward: () => {
    const state = get()
    if (!state.activeTabId) return

    const tabHistory = state.tabHistories[state.activeTabId]
    if (!tabHistory || tabHistory.currentIndex >= tabHistory.entries.length - 1) return

    const newIndex = tabHistory.currentIndex + 1
    const targetEntry = tabHistory.entries[newIndex]

    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === s.activeTabId
          ? {
              ...t,
              type: targetEntry.type,
              title: targetEntry.title,
              docId: targetEntry.docId,
              tagId: targetEntry.tagId,
            }
          : t
      ),
      tabHistories: {
        ...s.tabHistories,
        [s.activeTabId!]: { ...tabHistory, currentIndex: newIndex },
      },
    }))
  },

  canGoBack: (tabId) => {
    const state = get()
    const tabHistory = state.tabHistories[tabId]
    return tabHistory != null && tabHistory.currentIndex > 0
  },

  canGoForward: (tabId) => {
    const state = get()
    const tabHistory = state.tabHistories[tabId]
    return tabHistory != null && tabHistory.currentIndex < tabHistory.entries.length - 1
  },

  getCurrentEntry: (tabId) => {
    const state = get()
    const tabHistory = state.tabHistories[tabId]
    if (!tabHistory || tabHistory.currentIndex < 0) return null
    return tabHistory.entries[tabHistory.currentIndex] ?? null
  },

  removeDocFromHistory: (docId) => {
    set((state) => {
      const newHistories: Record<string, TabHistory> = {}

      for (const [tabId, tabHistory] of Object.entries(state.tabHistories)) {
        const filteredEntries = tabHistory.entries.filter((e) => e.docId !== docId)

        if (filteredEntries.length === 0) continue

        const currentEntry = tabHistory.entries[tabHistory.currentIndex]
        let newIndex = filteredEntries.length - 1

        if (currentEntry && currentEntry.docId !== docId) {
          const foundIndex = filteredEntries.findIndex(
            (e) =>
              e.type === currentEntry.type &&
              e.title === currentEntry.title &&
              e.docId === currentEntry.docId
          )
          if (foundIndex !== -1) newIndex = foundIndex
        } else {
          newIndex = Math.min(tabHistory.currentIndex, filteredEntries.length - 1)
        }

        newHistories[tabId] = {
          entries: filteredEntries,
          currentIndex: Math.max(0, newIndex),
        }
      }

      return { tabHistories: newHistories }
    })
  },

  exportSession: () => {
    const state = get()
    const activeTab = state.tabs.find((t) => t.id === state.activeTabId)
    return {
      tabs: state.tabs.map((t) => ({
        pageType: t.type,
        title: t.title,
        docId: t.docId,
        tagId: t.tagId,
      })),
      activeTabType: activeTab?.type,
      activeDocId: activeTab?.docId,
    }
  },

  restoreFromSession: (session) => {
    if (!session.tabs.length) {
      set({ sessionRestored: true })
      return false
    }

    const newTabs: Tab[] = []
    const newHistories: Record<string, TabHistory> = {}
    let restoredActiveId: string | null = null

    for (const saved of session.tabs) {
      const id = `${saved.pageType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const tab: Tab = {
        id,
        type: (saved.pageType as PageType) || "all-docs",
        title: saved.title || getPageTitle(saved.pageType as PageType) || i18n.t("common:unnamed"),
        docId: saved.docId,
        tagId: saved.tagId,
      }
      newTabs.push(tab)

      const entry: HistoryEntry = {
        type: tab.type,
        title: tab.title,
        docId: tab.docId,
        tagId: tab.tagId,
      }
      newHistories[id] = { entries: [entry], currentIndex: 0 }

      if (
        saved.pageType === session.activeTabType &&
        (!session.activeDocId || saved.docId === session.activeDocId)
      ) {
        restoredActiveId = id
      }
    }

    set({
      tabs: newTabs,
      activeTabId: restoredActiveId ?? newTabs[0]?.id ?? null,
      tabHistories: newHistories,
      sessionRestored: true,
    })
    return true
  },

  saveSession: async () => {
    const state = get()
    if (!state.sessionRestored) return
    const session = state.exportSession()
    await useSettingsStore.getState().saveTabSession(session)
  },
}))

const useTabStore = useNavigationStore
export { useTabStore }
