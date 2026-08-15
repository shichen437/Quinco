import { CloudSync, HardDrive, Info, Settings2, Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"

import type { SettingsSection } from "../SettingsPage"

function SettingsSidebar({
  active,
  onSelect,
}: {
  active: SettingsSection
  onSelect: (key: SettingsSection) => void
}) {
  const { t } = useTranslation("settings")

  const sections: {
    key: SettingsSection
    label: string
    icon: React.ElementType
  }[] = [
    { key: "general", label: t("sections.general"), icon: Settings2 },
    { key: "storage", label: t("sections.storage"), icon: HardDrive },
    { key: "data", label: t("sections.data"), icon: CloudSync },
    { key: "ai", label: t("sections.ai"), icon: Sparkles },
    { key: "about", label: t("sections.about"), icon: Info },
  ]

  return (
    <nav className="space-y-0.5">
      {sections.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onSelect(key)}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
            active === key
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          )}
        >
          <Icon className="size-4 shrink-0" />
          {label}
        </button>
      ))}
    </nav>
  )
}

export default SettingsSidebar
