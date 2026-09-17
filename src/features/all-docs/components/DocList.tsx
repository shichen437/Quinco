import { useCallback } from "react"

import { useTranslation } from "react-i18next"

import type { Document } from "@/api/tauri-bridge/document"
import { DocListItem } from "@/components/common/DocListItem"
import { EmptyDescription, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody } from "@/components/ui/table"

interface DocListProps {
  documents: Document[]
  onDocClick: (doc: Document) => void
  onMutate?: () => void
}

function DocList({ documents, onDocClick, onMutate }: DocListProps) {
  const { t } = useTranslation("docs")
  if (documents.length === 0) {
    return (
      <div className="p-4 text-center">
        <EmptyTitle>{t("noResults")}</EmptyTitle>
        <EmptyDescription>{t("noResultsDesc")}</EmptyDescription>
      </div>
    )
  }

  const handleDocClick = useCallback((doc: Document) => onDocClick(doc), [onDocClick])

  return (
    <Table className="[&_tr]:border-0 [&_thead_tr]:border-0">
      <TableBody>
        {documents.map((doc) => (
          <DocListItem key={doc.id} doc={doc} onClick={handleDocClick} onMutate={onMutate} />
        ))}
      </TableBody>
    </Table>
  )
}

export default DocList
