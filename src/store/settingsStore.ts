import i18n from "i18next"
import { create } from "zustand"

import type { SupportedLang } from "@/i18n"
import { getStoreValue, setStoreValue, STORE_KEYS } from "@/lib/quincoStore"

export type ThemeMode = "system" | "light" | "dark"
export type ResolvedTheme = "light" | "dark"

function resolveTheme(theme: ThemeMode): ResolvedTheme {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  }
  return theme
}

function applyThemeClass(resolved: ResolvedTheme) {
  document.documentElement.classList.toggle("dark", resolved === "dark")
}

interface SettingsState {
  open: boolean
  theme: ThemeMode
  resolvedTheme: ResolvedTheme
  lang: SupportedLang
  openSettings: () => void
  closeSettings: () => void
  setTheme: (theme: ThemeMode) => void
  setLang: (lang: SupportedLang) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  open: false,
  theme: "system",
  resolvedTheme: resolveTheme("system"),
  lang: "zh",
  openSettings: () => set({ open: true }),
  closeSettings: () => set({ open: false }),
  setTheme: (theme) => {
    const resolvedTheme = resolveTheme(theme)
    set({ theme, resolvedTheme })
    applyThemeClass(resolvedTheme)
    setStoreValue(STORE_KEYS.theme, theme)
  },
  setLang: (lang) => {
    set({ lang })
    i18n.changeLanguage(lang)
    setStoreValue(STORE_KEYS.lang, lang)
  },
}))

Promise.all([getStoreValue<string>(STORE_KEYS.theme), getStoreValue<string>(STORE_KEYS.lang)]).then(
  ([savedTheme, savedLang]) => {
    const updates: Partial<SettingsState> = {}

    if (savedTheme) {
      const theme = savedTheme as ThemeMode
      const resolved = resolveTheme(theme)
      updates.theme = theme
      updates.resolvedTheme = resolved
      applyThemeClass(resolved)
    }

    if (savedLang && (savedLang === "zh" || savedLang === "en")) {
      updates.lang = savedLang as SupportedLang
      i18n.changeLanguage(savedLang as SupportedLang)
    }

    if (Object.keys(updates).length > 0) {
      useSettingsStore.setState(updates)
    }
  }
)

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  const { theme } = useSettingsStore.getState()
  if (theme !== "system") return
  const resolved = resolveTheme("system")
  useSettingsStore.setState({ resolvedTheme: resolved })
  applyThemeClass(resolved)
})
