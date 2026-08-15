import { useTranslation } from "react-i18next"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LANG_LABELS, type SupportedLang } from "@/i18n"
import { useSettingsStore, type ThemeMode } from "@/store/settingsStore"

import SectionShell from "./common/SectionShell"

function GeneralSection() {
  const { t } = useTranslation("settings")
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const lang = useSettingsStore((s) => s.lang)
  const setLang = useSettingsStore((s) => s.setLang)

  const themeLabels: Record<ThemeMode, string> = {
    system: t("general.system"),
    light: t("general.light"),
    dark: t("general.dark"),
  }

  return (
    <SectionShell title={t("sections.general")}>
      <div className="flex items-center justify-between py-0.5">
        <span className="text-sm">{t("general.language")}</span>
        <Select value={lang} onValueChange={(value) => setLang(value as SupportedLang)}>
          <SelectTrigger className="w-36">
            <SelectValue>{LANG_LABELS[lang]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(LANG_LABELS) as SupportedLang[]).map((code) => (
              <SelectItem key={code} value={code}>
                {LANG_LABELS[code]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between py-0.5">
        <span className="text-sm">{t("general.theme")}</span>
        <Select value={theme} onValueChange={(value) => setTheme(value as ThemeMode)}>
          <SelectTrigger className="w-36">
            <SelectValue>{themeLabels[theme]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(themeLabels) as ThemeMode[]).map((mode) => (
              <SelectItem key={mode} value={mode}>
                {themeLabels[mode]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </SectionShell>
  )
}

export default GeneralSection
