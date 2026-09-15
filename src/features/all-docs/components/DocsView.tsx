import { FileText } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Document } from "@/api/tauri-bridge/document"
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import DocList from "@/features/all-docs/components/DocList"

interface DocsViewProps {
  documents: Document[]
  onDocClick: (doc: Document) => void
}

function DocsView({ documents, onDocClick }: DocsViewProps) {
  const { t } = useTranslation("docs")
  if (documents.length === 0) {
    return (
      <Empty className="border-0">
        <EmptyMedia variant="icon">
          <FileText className="size-6" />
        </EmptyMedia>
        <EmptyTitle>{t("noDocs")}</EmptyTitle>
        <EmptyDescription>{t("createFirstDoc")}</EmptyDescription>
      </Empty>
    )
  }

  return (
    <div className="space-y-2">
      <span className="inline-block rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
        {t("allDocs")}
      </span>

      <DocList documents={documents} onDocClick={onDocClick} />
    </div>
  )
}

export default DocsView
