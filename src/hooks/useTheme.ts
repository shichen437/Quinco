import { useEffect } from "react"

import { useSettingsStore } from "@/stores/settingsStore"

type ThemeValue = "light" | "dark" | "system"

const applyTheme = (theme: ThemeValue, mq: MediaQueryList | MediaQueryListEvent) => {
  const isDark = theme === "dark" || (theme === "system" && mq.matches)
  document.documentElement.classList.toggle("dark", isDark)
}

/**
 * Synchronizes the theme setting from the store to the document.
 * - Reads `config.theme` and toggles the `dark` class on `<html>`.
 * - When theme is "system", listens to `prefers-color-scheme` changes.
 */
export function useTheme() {
  const theme = useSettingsStore((s) => (s.config?.theme as ThemeValue) ?? "system")

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    applyTheme(theme, mq)

    if (theme !== "system") return

    const handler = (e: MediaQueryListEvent) => applyTheme("system", e)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [theme])
}
