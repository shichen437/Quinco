import { useEffect, useState } from "react"

import { useTranslation } from "react-i18next"

import { getGraphData, type GraphData } from "@/api/doc"
import { toast } from "@/components/ui/toast"

import GraphCanvas from "./components/GraphCanvas"

function GraphPage() {
  const { t } = useTranslation("graph")
  const [data, setData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await getGraphData()
        if (!cancelled) setData(result)
      } catch (err) {
        if (!cancelled) {
          setError(String(err))
          toast.add({
            title: t("common:operationFailed"),
            description: t("common:loadFailed"),
            type: "error",
          })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
        {t("loading")}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-destructive">
        {t("loadError", { error })}
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex-1 overflow-hidden">
        <GraphCanvas data={data} />
      </div>
    </div>
  )
}

export default GraphPage
