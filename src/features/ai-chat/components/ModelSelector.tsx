import { useEffect, useState } from "react"

import { useTranslation } from "react-i18next"

import { listAllAiModels, type ProviderModels } from "@/api/tauri-bridge/ai"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAiChatStore } from "@/stores/aiChatStore"

const PROVIDER_LABELS: Record<string, string> = {
  gemini: "Google Gemini",
  zhipu: "智谱清言",
  moonshot: "Kimi",
}

export function ModelSelector() {
  const { t } = useTranslation("home")
  const [providerModels, setProviderModels] = useState<ProviderModels[]>([])
  const [modelsLoading, setModelsLoading] = useState(true)
  const selectedProvider = useAiChatStore((s) => s.selectedProvider)
  const selectedModel = useAiChatStore((s) => s.selectedModel)
  const setSelectedModel = useAiChatStore((s) => s.setSelectedModel)

  useEffect(() => {
    let cancelled = false
    setModelsLoading(true)
    listAllAiModels()
      .then((data) => {
        if (cancelled) return
        setProviderModels(data)
      })
      .catch((err) => {
        if (cancelled) return
        console.error("Failed to load models:", err)
      })
      .finally(() => {
        if (!cancelled) setModelsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const hasModels = providerModels.some((pm) => pm.models.length > 0)

  return (
    <Select
      value={
        selectedProvider && selectedModel
          ? selectedProvider === "auto"
            ? ""
            : `${selectedProvider}/${selectedModel}`
          : ""
      }
      itemToStringLabel={(v) => {
        if (!v || typeof v !== "string") return ""
        const idx = v.indexOf("/")
        return idx === -1 ? v : v.slice(idx + 1)
      }}
      onValueChange={(v) => {
        if (!v) {
          setSelectedModel("auto", "auto")
        } else if (v.includes("/")) {
          const [provider, model] = v.split("/", 2)
          setSelectedModel(provider, model)
        } else {
          setSelectedModel(null, v)
        }
      }}
      disabled={modelsLoading || !hasModels}
    >
      <SelectTrigger size="sm" className="w-40">
        <SelectValue placeholder={modelsLoading ? t("loading") : "Auto"} />
      </SelectTrigger>
      <SelectContent align="start" className="w-56 max-h-120 overflow-y-auto">
        <SelectGroup>
          <SelectItem value="">Auto</SelectItem>
        </SelectGroup>
        {hasModels &&
          providerModels
            .filter((pm) => pm.models.length > 0)
            .map((pm) => (
              <SelectGroup key={pm.provider}>
                <SelectLabel>{PROVIDER_LABELS[pm.provider] ?? pm.provider}</SelectLabel>
                {pm.models.map((m) => (
                  <SelectItem key={`${pm.provider}/${m.name}`} value={`${pm.provider}/${m.name}`}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
      </SelectContent>
    </Select>
  )
}
