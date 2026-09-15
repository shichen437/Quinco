import { useEffect } from "react"

import { TooltipProvider } from "@/components/ui/tooltip"
import { useTheme } from "@/hooks/useTheme"
import MainLayout from "@/layouts/MainLayout"
import { useNavigationStore } from "@/stores/navigationStore"
import { useSettingsStore } from "@/stores/settingsStore"
import { useWorkspaceStore } from "@/stores/workspaceStore"

import "./global.css"

function App() {
  const initializeWorkspace = useWorkspaceStore((s) => s.initialize)
  const initializeSettings = useSettingsStore((s) => s.initialize)
  const restoreFromSession = useNavigationStore((s) => s.restoreFromSession)
  const saveSession = useNavigationStore((s) => s.saveSession)

  useTheme()

  useEffect(() => {
    initializeWorkspace().catch((err) => console.error("Failed to initialize workspace:", err))
    initializeSettings()
      .then(async () => {
        try {
          const session = await useSettingsStore.getState().loadTabSession()
          if (session) {
            restoreFromSession(session)
          } else {
            useNavigationStore.setState({ sessionRestored: true })
          }
        } catch (err) {
          console.error("Failed to restore tab session:", err)
          useNavigationStore.setState({ sessionRestored: true })
        }
      })
      .catch((err) => console.error("Failed to initialize settings:", err))
  }, [initializeWorkspace, initializeSettings, restoreFromSession])

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const flushSave = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      saveSession().catch((err) => console.error("Failed to save tab session:", err))
    }

    const unsubscribe = useNavigationStore.subscribe((state, prevState) => {
      if (!state.sessionRestored) return
      if (state.tabs === prevState.tabs && state.activeTabId === prevState.activeTabId) return

      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        flushSave()
      }, 500)
    })

    const handleBeforeUnload = () => {
      flushSave()
    }
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      unsubscribe()
    }
  }, [saveSession])

  return (
    <TooltipProvider>
      <MainLayout />
    </TooltipProvider>
  )
}

export default App
