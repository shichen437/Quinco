import { create } from "zustand"

import { useTabStore, type Tab, type TabType } from "./tabStore"

// 页面快照：标签页承载的页面内容
export interface PageEntry {
  type: TabType
  title: string
  docId?: string
  tagId?: number
}

interface TabHistory {
  backStack: PageEntry[]
  forwardStack: PageEntry[]
}

interface NavigationState {
  // 每个标签页独立的页面历史
  histories: Record<string, TabHistory>
  goBack: () => void
  goForward: () => void
}

// 标记是否正处于前进/后退导航中，避免页面切换监听重复记录
let isNavigating = false

const EMPTY_HISTORY: TabHistory = { backStack: [], forwardStack: [] }

function toEntry(tab: Tab): PageEntry {
  return { type: tab.type, title: tab.title, docId: tab.docId, tagId: tab.tagId }
}

function isSamePage(a: PageEntry, b: PageEntry) {
  return a.type === b.type && a.docId === b.docId && a.tagId === b.tagId && a.title === b.title
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  histories: {},

  goBack: () => {
    const activeTabId = useTabStore.getState().activeTabId
    const activeTab = useTabStore.getState().tabs.find((t) => t.id === activeTabId)
    if (!activeTab) return

    const { backStack, forwardStack } = get().histories[activeTab.id] ?? EMPTY_HISTORY
    if (backStack.length === 0) return

    const entry = backStack[backStack.length - 1]
    isNavigating = true
    useTabStore.getState().openTab(entry)
    isNavigating = false
    set((state) => ({
      histories: {
        ...state.histories,
        [activeTab.id]: {
          backStack: backStack.slice(0, -1),
          forwardStack: [...forwardStack, toEntry(activeTab)],
        },
      },
    }))
  },

  goForward: () => {
    const activeTabId = useTabStore.getState().activeTabId
    const activeTab = useTabStore.getState().tabs.find((t) => t.id === activeTabId)
    if (!activeTab) return

    const { backStack, forwardStack } = get().histories[activeTab.id] ?? EMPTY_HISTORY
    if (forwardStack.length === 0) return

    const entry = forwardStack[forwardStack.length - 1]
    isNavigating = true
    useTabStore.getState().openTab(entry)
    isNavigating = false
    set((state) => ({
      histories: {
        ...state.histories,
        [activeTab.id]: {
          backStack: [...backStack, toEntry(activeTab)],
          forwardStack: forwardStack.slice(0, -1),
        },
      },
    }))
  },
}))

// 监听标签页变化：记录当前标签页内的页面切换历史
useTabStore.subscribe((state, prevState) => {
  if (isNavigating) return

  const { histories } = useNavigationStore.getState()

  // 清理已关闭标签页的历史记录
  const currentIds = new Set(state.tabs.map((t) => t.id))
  let newHistories = histories
  for (const id of Object.keys(histories)) {
    if (!currentIds.has(id)) {
      if (newHistories === histories) newHistories = { ...histories }
      delete newHistories[id]
    }
  }

  // 激活标签页的页面内容发生切换时，旧页面入后退栈，并清空前进栈
  if (state.activeTabId) {
    const prevTab = prevState.tabs.find((t) => t.id === state.activeTabId)
    const currTab = state.tabs.find((t) => t.id === state.activeTabId)
    if (prevTab && currTab && !isSamePage(toEntry(prevTab), toEntry(currTab))) {
      const history = newHistories[currTab.id] ?? EMPTY_HISTORY
      newHistories = {
        ...newHistories,
        [currTab.id]: {
          backStack: [...history.backStack, toEntry(prevTab)],
          forwardStack: [],
        },
      }
    }
  }

  if (newHistories !== histories) {
    useNavigationStore.setState({ histories: newHistories })
  }
})
