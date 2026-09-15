import { useCallback, useEffect, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

import { AuroraText } from "@/components/ui/aurora-text"
import { checkForUpdate, getCurrentVersion } from "@/lib/updater"

type CheckStatus = "idle" | "checking" | "done"

function AboutSection() {
  const { t } = useTranslation("setting")
  const [currentVersion, setCurrentVersion] = useState("")
  const [status, setStatus] = useState<CheckStatus>("idle")
  const loadingRef = useRef(false)

  useEffect(() => {
    getCurrentVersion().then((v) => {
      setCurrentVersion(v)
    })
  }, [])

  const handleCheck = useCallback(async () => {
    if (status === "checking" || loadingRef.current) return
    loadingRef.current = true
    setStatus("checking")
    try {
      await checkForUpdate()
      setStatus("done")
    } catch {
      setStatus("idle")
    } finally {
      loadingRef.current = false
    }
  }, [status])

  const renderBottomText = () => {
    const canCheck = status === "idle" || status === "done"
    return (
      <button
        onClick={handleCheck}
        disabled={!canCheck}
        className="text-xs text-muted-foreground underline underline-offset-2 decoration-muted-foreground/40 hover:text-foreground hover:decoration-foreground/60 disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline transition-colors cursor-pointer bg-transparent border-none p-0"
      >
        {status === "checking"
          ? t("checking")
          : status === "done"
            ? t("upToDate")
            : t("checkUpdate")}
      </button>
    )
  }

  return (
    <div className="space-y-6 py-2">
      <div className="text-center py-4 text-4xl flex items-center justify-center gap-2">
        <AuroraText>Quinco</AuroraText>
        <span className="inline-flex h-5 shrink-0 items-center justify-center rounded-4xl border border-amber-500/20 bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600 dark:border-amber-500/30 dark:text-amber-400">
          Beta
        </span>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("currentVersion")}</span>
          <span>{currentVersion ? `v${currentVersion}` : "-"}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("sourceCode")}</span>
          <a
            href="https://github.com/shichen437/Quinco"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {t("viewSource")}
          </a>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("contactAuthor")}</span>
          <span>shichen437@126.com</span>
        </div>
      </div>

      <div className="flex justify-center pt-2">{renderBottomText()}</div>
    </div>
  )
}

export default AboutSection
