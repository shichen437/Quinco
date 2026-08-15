import { useTranslation } from "react-i18next"

import { Kbd } from "@/components/ui/kbd"
import { getHotkeyLabel } from "@/hooks/useGlobalHotkeys"

function WelcomePage() {
  const { t } = useTranslation("welcome")

  const HOTKEYS = [
    { label: t("hotkeys.quickSearch"), hotkey: "ctrl+shift+s" },
    { label: t("hotkeys.createDoc"), hotkey: "ctrl+shift+n" },
    { label: t("hotkeys.allDocs"), hotkey: "ctrl+shift+a" },
    { label: t("hotkeys.graph"), hotkey: "ctrl+shift+g" },
  ]

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 -mt-42">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">{t("welcome")}</h1>
      </div>
      <div className="flex flex-col gap-2">
        {HOTKEYS.map(({ label, hotkey }) => (
          <div key={hotkey} className="flex items-center justify-between gap-32 text-base">
            <span className="text-muted-foreground">{label}</span>
            <Kbd>{getHotkeyLabel(hotkey)}</Kbd>
          </div>
        ))}
      </div>
    </div>
  )
}

export default WelcomePage
