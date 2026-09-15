import { useTranslation } from "react-i18next"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { useSettingsStore } from "@/stores/settingsStore"

const langLabels: Record<string, string> = {
  zh: "简体中文",
  en: "English",
}

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

function GeneralSection() {
  const { t } = useTranslation("setting")
  const theme = useSettingsStore((s) => s.config?.theme ?? "system")
  const lang = useSettingsStore((s) => s.config?.lang ?? "zh")
  const setTheme = useSettingsStore((s) => s.setTheme)
  const setLang = useSettingsStore((s) => s.setLang)

  const handleSetLang = (value: string | null) => {
    if (value) void setLang(value)
  }
  const handleSetTheme = (value: string | null) => {
    if (value) void setTheme(value)
  }

  const themeLabel =
    theme === "system" ? t("themeSystem") : theme === "light" ? t("themeLight") : t("themeDark")

  return (
    <div className="divide-y divide-border">
      <SettingRow title={t("displayLanguage")} description={t("displayLanguageDesc")}>
        <Select value={lang} onValueChange={handleSetLang}>
          <SelectTrigger className="w-35">
            <span className="flex-1 text-left text-sm text-muted-foreground">
              {langLabels[lang] ?? lang}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="zh">简体中文</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>
      <SettingRow title={t("theme")} description={t("themeDesc")}>
        <Select value={theme} onValueChange={handleSetTheme}>
          <SelectTrigger className="w-35">
            <span className="flex-1 text-left text-sm text-muted-foreground">{themeLabel}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="system">{t("themeSystem")}</SelectItem>
            <SelectItem value="light">{t("themeLight")}</SelectItem>
            <SelectItem value="dark">{t("themeDark")}</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>
    </div>
  )
}

export default GeneralSection
