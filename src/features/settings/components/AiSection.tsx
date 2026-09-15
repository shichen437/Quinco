import { useState } from "react"

import { ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useSettingsStore } from "@/stores/settingsStore"

import AiProvidersConfig from "./subpages/AiProvidersConfig"

interface SettingRowProps {
  title: string
  description?: string
  children: React.ReactNode
}

function SettingRow({ title, description, children }: SettingRowProps) {
  return (
    <div className="flex items-start justify-between gap-8 py-4 first:pt-2">
      <div className="min-w-0 flex-1">
        <Label className="text-sm">{title}</Label>
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="shrink-0 pt-0.5">{children}</div>
    </div>
  )
}

function AiSection() {
  const { t } = useTranslation("setting")
  const aiEnabled = useSettingsStore((s) => s.config?.aiEnabled ?? false)
  const setAiEnabled = useSettingsStore((s) => s.setAiEnabled)
  const [subpage, setSubpage] = useState<"main" | "providers">("main")

  if (subpage === "providers") {
    return <AiProvidersConfig onBack={() => setSubpage("main")} />
  }

  return (
    <div className="divide-y divide-border">
      <SettingRow title={t("enableAi")} description={t("enableAiDesc")}>
        <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
      </SettingRow>
      <SettingRow title={t("llmProviders")} description={t("llmProvidersDesc")}>
        <button
          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm cursor-pointer transition-colors hover:bg-muted/80 hover:text-foreground"
          onClick={() => setSubpage("providers")}
        >
          {t("configure")} <ChevronRight className="size-4" />
        </button>
      </SettingRow>
    </div>
  )
}

export default AiSection
