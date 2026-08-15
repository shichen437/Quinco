import { useTranslation } from "react-i18next"

import SectionShell from "./common/SectionShell"

function AiSection() {
  const { t } = useTranslation(["settings", "common"])
  return (
    <SectionShell title={t("settings:ai.title")}>
      <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        {t("common:comingSoon", { feature: "AI" })}
      </div>
    </SectionShell>
  )
}

export default AiSection
