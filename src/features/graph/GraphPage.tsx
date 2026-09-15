import { useCallback, useEffect, useState } from "react"

import { Network } from "lucide-react"
import { useTranslation } from "react-i18next"

import { getGraphData, type GraphData } from "@/api/tauri-bridge/graph"
import { getErrorMessage } from "@/api/tauri-bridge/helper"
import GraphCanvas from "@/features/graph/GraphCanvas"

function GraphPage() {
  const { t } = useTranslation("docs")
  const [data, setData] = useState<GraphData>({ nodes: [], links: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        setLoading(true)
        setError(null)
        const result = await getGraphData()
        if (!cancelled) {
          setData(result)
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchData()
    return () => {
      cancelled = true
    }
  }, [])

  const handleRefresh = useCallback(() => {
    setLoading(true)
    getGraphData()
      .then((result) => {
        setData(result)
        setError(null)
      })
      .catch((err) => {
        setError(getErrorMessage(err))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return (
    <div className="relative flex h-full w-full flex-col">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="size-4 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
            {t("loadingGraph")}
          </div>
        </div>
      )}

      {/* Error state */}
      {error ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
          <Network className="size-8 text-destructive/60" />
          <p className="text-sm">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-2 rounded-md bg-secondary px-3 py-1.5 text-xs text-secondary-foreground hover:bg-secondary/80"
          >
            {t("reload")}
          </button>
        </div>
      ) : !loading && data.nodes.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
          <Network className="size-12 opacity-30" />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground/70">{t("noGraphData")}</p>
            <p className="mt-1 text-xs">{t("noGraphDataDesc")}</p>
          </div>
        </div>
      ) : !loading ? (
        <GraphCanvas data={data} />
      ) : null}
    </div>
  )
}

export default GraphPage
