import { useTranslation } from "react-i18next"

import type { Document } from "@/api/tauri-bridge/document"
import { DocListItem } from "@/components/common/DocListItem"
import { EmptyDescription, EmptyTitle } from "@/components/ui/empty"

interface DocListProps {
  documents: Document[]
  onDocClick: (doc: Document) => void
}

function DocList({ documents, onDocClick }: DocListProps) {
  const { t } = useTranslation("docs")
  if (documents.length === 0) {
    return (
      <div className="p-4 text-center">
        <EmptyTitle>{t("noResults")}</EmptyTitle>
        <EmptyDescription>{t("noResultsDesc")}</EmptyDescription>
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      {documents.map((doc) => (
        <DocListItem key={doc.id} doc={doc} onClick={onDocClick} />
      ))}
    </div>
  )
}

export default DocList
