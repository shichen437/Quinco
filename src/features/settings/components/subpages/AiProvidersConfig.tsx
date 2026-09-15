import { useEffect, useState } from "react"

import { ArrowLeft, Check, Loader2, RotateCcw } from "lucide-react"
import { useTranslation } from "react-i18next"

import { getAllApiKeyStatus, resetApiKey, setApiKey } from "@/api/tauri-bridge/system"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ProviderInfo {
  key: string
  name: string
  description: string
}

const PROVIDERS: ProviderInfo[] = [
  { key: "gemini", name: "Google Gemini", description: "generativelanguage.googleapis.com" },
  { key: "moonshot", name: "Moonshot", description: "api.moonshot.cn" },
  { key: "zhipu", name: "Zhipu", description: "open.bigmodel.cn" },
]

interface ProviderCardProps {
  provider: ProviderInfo
  configured: boolean
}

function ProviderCard({ provider, configured }: ProviderCardProps) {
  const { t } = useTranslation("setting")
  const [apiKey, setApiKeyValue] = useState("")
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSave = async () => {
    if (!apiKey.trim()) return
    setSaving(true)
    try {
      await setApiKey(provider.key, apiKey.trim())
      setApiKeyValue("")
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
      window.dispatchEvent(new CustomEvent("ai-providers-changed"))
    } catch (err) {
      console.error("Failed to save API key:", err)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    setResetting(true)
    try {
      await resetApiKey(provider.key)
      window.dispatchEvent(new CustomEvent("ai-providers-changed"))
    } catch (err) {
      console.error("Failed to reset API key:", err)
    } finally {
      setResetting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSave()
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">{provider.name}</Label>
            {configured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                <Check className="size-3" />
                {t("configured")}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{provider.description}</p>
        </div>
        {configured && (
          <button
            type="button"
            onClick={handleReset}
            disabled={resetting}
            className="inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 cursor-pointer"
            title={t("resetApiKey")}
          >
            {resetting ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <RotateCcw className="size-3" />
            )}
            {t("reset")}
          </button>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Input
          type="password"
          placeholder={configured ? t("inputNewApiKey") : t("inputApiKey")}
          value={apiKey}
          onChange={(e) => setApiKeyValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-8 text-sm"
          disabled={saving}
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !apiKey.trim()}
          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
        >
          {saving ? (
            <Loader2 className="size-3 animate-spin" />
          ) : success ? (
            <Check className="size-3" />
          ) : null}
          {success ? t("saved") : t("save")}
        </button>
      </div>
    </div>
  )
}

function AiProvidersConfig({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation("setting")
  const [statusMap, setStatusMap] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  const fetchStatus = async () => {
    try {
      const map = await getAllApiKeyStatus()
      setStatusMap(map)
    } catch (err) {
      console.error("Failed to get API key status:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()

    const handler = () => fetchStatus()
    window.addEventListener("ai-providers-changed", handler)
    return () => window.removeEventListener("ai-providers-changed", handler)
  }, [])

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer -ml-2"
      >
        <ArrowLeft className="size-4" />
        {t("return")}
      </button>
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          PROVIDERS.map((provider) => (
            <ProviderCard
              key={provider.key}
              provider={provider}
              configured={statusMap[provider.key] ?? false}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default AiProvidersConfig
