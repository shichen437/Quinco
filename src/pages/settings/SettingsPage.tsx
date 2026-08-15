import { useState } from "react"

import { useTranslation } from "react-i18next"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useSettingsStore } from "@/store/settingsStore"

import AboutSection from "./components/AboutSection"
import AiSection from "./components/AiSection"
import DataSection from "./components/DataSection"
import GeneralSection from "./components/GeneralSection"
import SettingsSidebar from "./components/SettingsSidebar"
import StorageSection from "./components/StorageSection"

export type SettingsSection = "general" | "storage" | "data" | "ai" | "about"

function SettingsPage() {
  const { t } = useTranslation("settings")
  const open = useSettingsStore((s) => s.open)
  const closeSettings = useSettingsStore((s) => s.closeSettings)
  const [active, setActive] = useState<SettingsSection>("general")

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) closeSettings()
      }}
    >
      <DialogContent className="h-150 gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <div className="flex h-full">
          <div className="flex w-45 shrink-0 flex-col border-r bg-muted/30 p-3">
            <DialogTitle className="px-2 pb-3 pt-1 text-xl">{t("title")}</DialogTitle>
            <SettingsSidebar active={active} onSelect={setActive} />
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-lg px-2 py-6">
              {active === "general" && <GeneralSection />}
              {active === "storage" && <StorageSection />}
              {active === "data" && <DataSection />}
              {active === "ai" && <AiSection />}
              {active === "about" && <AboutSection />}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SettingsPage
