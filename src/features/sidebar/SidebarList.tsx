import React, { useEffect } from "react"

import { useTranslation } from "react-i18next"

import { getRecentDocuments, type Document } from "@/api/tauri-bridge/document"
import { getWorkspaceTags, type TagDTO } from "@/api/tauri-bridge/tag"
import DocEmojiIcon from "@/components/common/DocEmojiIcon"
import { Empty, EmptyDescription } from "@/components/ui/empty"
import { SidebarMenuButton } from "@/components/ui/sidebar"
import { truncate } from "@/lib/string"
import { type TagColor } from "@/lib/tag_color"
import { useFavoritesStore } from "@/stores/favoritesStore"
import { useTabStore } from "@/stores/navigationStore"

function TagDot({ color }: { color: TagColor }) {
  return <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
}

interface SidebarDocListProps {
  documents: Document[]
}

export function SidebarDocList({ documents }: SidebarDocListProps) {
  const { t } = useTranslation("common")
  const openDocInActiveTab = useTabStore((s) => s.openDocInActiveTab)

  if (documents.length === 0) {
    return (
      <Empty className="border-0 p-4">
        <EmptyDescription>{t("noContent")}</EmptyDescription>
      </Empty>
    )
  }

  return (
    <>
      {documents.map((doc) => (
        <SidebarMenuButton
          key={doc.id}
          onClick={() => openDocInActiveTab(doc.id, doc.title || t("unnamed"))}
          className="gap-2"
        >
          <DocEmojiIcon emoji={doc.emoji} className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{truncate(doc.title || t("unnamed"), 10)}</span>
        </SidebarMenuButton>
      ))}
    </>
  )
}

interface SidebarTagListProps {
  tags: TagDTO[]
}

export function SidebarTagList({ tags }: SidebarTagListProps) {
  const { t } = useTranslation("common")
  if (tags.length === 0) {
    return (
      <Empty className="border-0 p-4">
        <EmptyDescription>{t("noContent")}</EmptyDescription>
      </Empty>
    )
  }

  return (
    <>
      {tags.map((tag) => (
        <SidebarMenuButton className="px-4" key={tag.id}>
          <TagDot color={tag.color as TagColor} />
          <span>{tag.name}</span>
        </SidebarMenuButton>
      ))}
    </>
  )
}

const MAX_RECENT_ITEMS = 15

export function SidebarFavorites() {
  const favorites = useFavoritesStore((s) => s.favorites)
  return <SidebarDocList documents={favorites} />
}

export function SidebarRecents() {
  const [documents, setDocuments] = React.useState<Document[]>([])

  useEffect(() => {
    getRecentDocuments(MAX_RECENT_ITEMS)
      .then(setDocuments)
      .catch((err) => console.error("Failed to load recent documents:", err))
  }, [])

  return <SidebarDocList documents={documents} />
}

export function SidebarTags() {
  const [tags, setTags] = React.useState<TagDTO[]>([])

  useEffect(() => {
    getWorkspaceTags()
      .then(setTags)
      .catch((err) => console.error("Failed to load workspace tags:", err))
  }, [])

  return <SidebarTagList tags={tags} />
}

export default SidebarFavorites
