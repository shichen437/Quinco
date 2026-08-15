import { useCallback, useEffect, useState } from "react"

import { useTranslation } from "react-i18next"

import {
  deleteDocPermanently,
  listTrashDocs,
  restoreDocFromTrash,
  type TrashDocItem,
} from "@/api/doc"
import ConfirmDialog from "@/components/common/ConfirmDialog"
import { useFavoriteStore } from "@/store/favoriteStore"
import { useTabStore } from "@/store/tabStore"

import TrashDocListItem from "./components/TrashDocListItem"

function TrashPage() {
  const { t } = useTranslation(["trash", "common"])
  const loadFavorites = useFavoriteStore((s) => s.loadFavorites)
  const openTab = useTabStore((s) => s.openTab)
  const [docs, setDocs] = useState<TrashDocItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<TrashDocItem | null>(null)

  const loadDocs = useCallback(async () => {
    setLoading(true)
    try {
      setDocs(await listTrashDocs())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDocs()
  }, [loadDocs])

  const handleRestore = useCallback(
    async (doc: TrashDocItem) => {
      await restoreDocFromTrash(doc.id)
      setDocs((prev) => prev.filter((d) => d.id !== doc.id))
      loadFavorites()
    },
    [loadFavorites]
  )

  const handleDeletePermanently = useCallback(async () => {
    if (!deleteTarget) return
    await deleteDocPermanently(deleteTarget.id)
    setDocs((prev) => prev.filter((d) => d.id !== deleteTarget.id))
  }, [deleteTarget])

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-12 shrink-0 items-center px-6">
        <h1 className="text-lg font-semibold">{t("title")}</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
            {t("common:loading")}
          </div>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-sm text-muted-foreground">
            {t("empty")}
          </div>
        ) : (
          <div className="space-y-0.5 px-3">
            {docs.map((doc) => (
              <TrashDocListItem
                key={doc.id}
                title={doc.title}
                emoji={doc.emoji}
                onClick={() =>
                  openTab({
                    type: "editor",
                    title: doc.title || t("common:untitled"),
                    docId: doc.id,
                  })
                }
                onRestore={() => handleRestore(doc)}
                onDelete={() => setDeleteTarget(doc)}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title={t("deletePermanently")}
        description={t("deletePermanentlyDesc", {
          title: deleteTarget?.title || t("common:untitled"),
        })}
        destructive
        onConfirm={handleDeletePermanently}
      />
    </div>
  )
}

export default TrashPage
