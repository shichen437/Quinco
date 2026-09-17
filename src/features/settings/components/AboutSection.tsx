import { useCallback, useEffect, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

import { AuroraText } from "@/components/ui/aurora-text"
import {
  checkForUpdate,
  downloadUpdate,
  getCurrentVersion,
  restartApp,
  type Update,
} from "@/lib/updater"

type CheckStatus =
  "idle" | "checking" | "upToDate" | "available" | "downloading" | "installing" | "ready" | "failed"

function AboutSection() {
  const { t } = useTranslation("setting")
  const [currentVersion, setCurrentVersion] = useState("")
  const [latestVersion, setLatestVersion] = useState("")
  const [pendingUpdate, setPendingUpdate] = useState<Update | null>(null)
  const [status, setStatus] = useState<CheckStatus>("idle")
  const [progress, setProgress] = useState(0)
  const loadingRef = useRef(false)

  useEffect(() => {
    getCurrentVersion().then((v) => {
      setCurrentVersion(v)
    })
  }, [])

  const handleCheck = useCallback(async () => {
    if (loadingRef.current) return
    loadingRef.current = true
    setStatus("checking")
    try {
      const update = await checkForUpdate()
      if (update) {
        setLatestVersion(update.version)
        setPendingUpdate(update)
        setStatus("available")
      } else {
        setStatus("upToDate")
      }
    } catch {
      setStatus("failed")
    } finally {
      loadingRef.current = false
    }
  }, [])

  const handleDownload = useCallback(async () => {
    const update = pendingUpdate
    if (!update || loadingRef.current) return
    loadingRef.current = true
    setStatus("downloading")
    try {
      await downloadUpdate(update, (p) => {
        if (p.contentLength && p.contentLength > 0) {
          setProgress(Math.round((p.downloaded / p.contentLength) * 100))
        }
        if (p.phase === "installing") {
          setStatus("installing")
        }
      })
      setStatus("ready")
    } catch {
      setStatus("failed")
      loadingRef.current = false
    }
  }, [pendingUpdate])

  const handleRestart = useCallback(() => {
    restartApp()
  }, [])

  const handleReset = useCallback(() => {
    setStatus("idle")
    setLatestVersion("")
    setPendingUpdate(null)
    setProgress(0)
    loadingRef.current = false
  }, [])

  const renderBottom = () => {
    switch (status) {
      case "checking":
        return (
          <button
            disabled
            className="text-xs text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            {t("checking")}
          </button>
        )

      case "upToDate":
        return (
          <button
            onClick={handleReset}
            className="text-xs text-muted-foreground underline underline-offset-2 decoration-muted-foreground/40 hover:text-foreground hover:decoration-foreground/60 transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            {t("upToDate")}
          </button>
        )

      case "available":
        return (
          <button
            onClick={handleDownload}
            className="text-xs text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary/60 transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            {t("updateAvailableDesc", {
              current: currentVersion,
              latest: latestVersion,
            })}{" "}
            · {t("downloadInstall")}
          </button>
        )

      case "downloading":
        return (
          <span className="text-xs text-muted-foreground">
            {t("downloading", { percent: progress })}
          </span>
        )

      case "installing":
        return <span className="text-xs text-muted-foreground">{t("installing")}</span>

      case "ready":
        return (
          <button
            onClick={handleRestart}
            className="text-xs text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary/60 transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            {t("restartNow")}
          </button>
        )

      case "failed":
        return (
          <button
            onClick={handleReset}
            className="text-xs text-destructive underline underline-offset-2 decoration-destructive/40 hover:decoration-destructive/60 transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            {t("updateFailed")}
          </button>
        )

      case "idle":
      default:
        return (
          <button
            onClick={handleCheck}
            className="text-xs text-muted-foreground underline underline-offset-2 decoration-muted-foreground/40 hover:text-foreground hover:decoration-foreground/60 transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            {t("checkUpdate")}
          </button>
        )
    }
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

      <div className="flex justify-center pt-2">{renderBottom()}</div>
    </div>
  )
}

export default AboutSection
