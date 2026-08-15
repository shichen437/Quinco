import { useTranslation } from "react-i18next"

import SectionShell from "./common/SectionShell"

function DataSection() {
  const { t } = useTranslation(["settings", "common"])
  return (
    <SectionShell title={t("settings:data.title")}>
      <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        {t("common:comingSoon", { feature: t("settings:data.title") })}
      </div>
    </SectionShell>
  )
}

export default DataSection
