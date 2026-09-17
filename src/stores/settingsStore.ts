import { create } from "zustand"

import { getErrorMessage } from "@/api/tauri-bridge/helper"
import { getConfig, setConfig, type Config } from "@/api/tauri-bridge/system"
import i18n from "@/i18n"

export interface PersistedTab {
  pageType: string
  title?: string
  docId?: string
  tagId?: number
}

export interface TabSession {
  tabs: PersistedTab[]
  activeTabType?: string
  activeDocId?: string
}

interface SettingsState {
  config: Config | null
  loading: boolean
  saving: boolean
  error: string | null
}

interface SettingsActions {
  initialize: () => Promise<void>
  update: (update: Partial<Config>) => Promise<void>
  setTheme: (theme: string) => Promise<void>
  setLang: (lang: string) => Promise<void>
  setAiEnabled: (enabled: boolean) => Promise<void>
  saveTabSession: (session: TabSession) => Promise<void>
  loadTabSession: () => Promise<TabSession | null>
}

export type SettingsStore = SettingsState & SettingsActions

function serializeSession(session: TabSession): string {
  return JSON.stringify(session)
}

function deserializeSession(raw: string): TabSession | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as TabSession
  } catch {
    return null
  }
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  config: null,
  loading: false,
  saving: false,
  error: null,

  initialize: async () => {
    set({ loading: true, error: null })
    try {
      const config = await getConfig()
      if (config?.lang) {
        i18n.changeLanguage(config.lang)
      }
      set({ config, loading: false })
    } catch (err) {
      const message = getErrorMessage(err)
      set({ loading: false, error: message })
    }
  },

  update: async (update) => {
    set({ saving: true, error: null })
    try {
      const config = await setConfig(update)
      set({ config, saving: false })
    } catch (err) {
      const message = getErrorMessage(err)
      try {
        const config = await getConfig()
        set({ config, saving: false, error: message })
      } catch {
        set({ saving: false, error: message })
      }
    }
  },

  setTheme: async (theme: string) => {
    await get().update({ theme })
  },

  setLang: async (lang: string) => {
    await get().update({ lang })
    i18n.changeLanguage(lang)
  },

  setAiEnabled: async (enabled: boolean) => {
    await get().update({ aiEnabled: enabled })
  },

  saveTabSession: async (session: TabSession) => {
    const serialized = serializeSession(session)
    await get().update({ openTabs: serialized })
  },

  loadTabSession: async () => {
    const { config } = get()
    if (config?.openTabs) {
      return deserializeSession(config.openTabs)
    }
    try {
      const freshConfig = await getConfig()
      set({ config: freshConfig })
      if (freshConfig.openTabs) {
        return deserializeSession(freshConfig.openTabs)
      }
    } catch {}
    return null
  },
}))

export function useConfig(): Config | null {
  return useSettingsStore((s) => s.config)
}
