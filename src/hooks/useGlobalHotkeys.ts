import { useEffect } from "react"

type HotkeyMap = Record<string, () => void>

const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent)

function parseHotkey(hotkey: string) {
  const parts = hotkey
    .toLowerCase()
    .split("+")
    .map((p) => p.trim())
  let ctrl = false
  let shift = false
  let alt = false
  let meta = false
  let key = ""

  for (const part of parts) {
    switch (part) {
      case "ctrl":
      case "control":
        meta = true
        break
      case "cmd":
      case "meta":
      case "command":
        meta = true
        break
      case "shift":
        shift = true
        break
      case "alt":
      case "option":
        alt = true
        break
      default:
        key = part
    }
  }

  return { ctrl, shift, alt, meta, key }
}

export function useGlobalHotkeys(hotkeys: HotkeyMap) {
  useEffect(() => {
    const bindings = Object.entries(hotkeys).map(([shortcut, handler]) => ({
      ...parseHotkey(shortcut),
      handler,
    }))

    function handleKeyDown(e: KeyboardEvent) {
      // 忽略来自输入框的按键
      const target = e.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return
      }

      for (const binding of bindings) {
        if (
          e.ctrlKey === binding.ctrl &&
          e.shiftKey === binding.shift &&
          e.altKey === binding.alt &&
          e.metaKey === binding.meta &&
          e.key.toLowerCase() === binding.key
        ) {
          e.preventDefault()
          binding.handler()
          return
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [hotkeys])
}

export function getHotkeyLabel(hotkey: string) {
  return hotkey
    .split("+")
    .map((p) => p.trim())
    .map((p) => {
      const lower = p.toLowerCase()
      if (lower === "ctrl" || lower === "control") return "⌘"
      if (lower === "shift") return isMac ? "⇧" : "Shift"
      if (lower === "alt" || lower === "option") return isMac ? "⌥" : "Alt"
      if (lower === "cmd" || lower === "meta" || lower === "command") return "⌘"
      return p.toUpperCase()
    })
    .join(isMac ? "" : "+")
}
