import { useEffect, useState } from "react"

import { openUrl } from "@tauri-apps/plugin-opener"

import { useTranslation } from "react-i18next"

import { AuroraText } from "@/components/ui/aurora-text"
import { getCurrentVersion, getLatestVersion } from "@/lib/updater"

import SectionShell from "./common/SectionShell"
import SettingRow from "./common/SettingRow"

const GITHUB_URL = "https://github.com/shichen437/Quinco"

function AboutSection() {
  const { t } = useTranslation("settings")
  const [currentVersion, setCurrentVersion] = useState("")
  const [latestVersion, setLatestVersion] = useState("")

  useEffect(() => {
    getCurrentVersion().then(setCurrentVersion)
    getLatestVersion().then(setLatestVersion)
  }, [])

  return (
    <SectionShell title={t("about.title")}>
      <div className="flex justify-center items-center p-4">
        <AuroraText className="text-4xl">Quinco</AuroraText>
      </div>
      <SettingRow label={t("about.currentVersion")} value={currentVersion || "-"} />
      <SettingRow label={t("about.latestVersion")} value={latestVersion || "-"} />
      <SettingRow
        label={t("about.sourceCode")}
        value={
          <a
            href={GITHUB_URL}
            onClick={(e) => {
              e.preventDefault()
              openUrl(GITHUB_URL)
            }}
            className="text-primary underline-offset-4 hover:underline"
          >
            {t("common:clickToVisit")}
          </a>
        }
      />
    </SectionShell>
  )
}

export default AboutSection
