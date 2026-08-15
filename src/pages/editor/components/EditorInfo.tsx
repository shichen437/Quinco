import { useMemo, useState } from "react"

import { ChevronDown, Clock, Tag, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { TagItem } from "@/api/tag"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useTagStore } from "@/store/tagStore"

interface EditorInfoProps {
  updatedAt?: string
  createdAt?: string
  tags: TagItem[]
  isLock: boolean
  isDelete: boolean
  onAttachTag: (tag: TagItem) => Promise<void>
  onDetachTag: (tagId: number) => Promise<void>
}

function EditorInfo({
  updatedAt,
  createdAt,
  tags,
  isLock,
  isDelete,
  onAttachTag,
  onDetachTag,
}: EditorInfoProps) {
  const readOnly = isLock || isDelete
  const [expanded, setExpanded] = useState(false)
  const [input, setInput] = useState("")
  const [focused, setFocused] = useState(false)
  const { t } = useTranslation("editor")
  const workspaceTags = useTagStore((s) => s.tags)
  const createTag = useTagStore((s) => s.createTag)

  // 联想候选：工作区标签中匹配输入且未附加到当前文档的标签
  const suggestions = useMemo(() => {
    const keyword = input.trim().toLowerCase()
    if (!keyword) return []
    return workspaceTags.filter(
      (t) => t.name.toLowerCase().includes(keyword) && !tags.some((d) => d.id === t.id)
    )
  }, [input, workspaceTags, tags])

  const attachTag = async (tag: TagItem) => {
    await onAttachTag(tag)
    setInput("")
  }

  // 回车：有精确匹配的已有标签则直接选择，否则创建新标签后附加
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const trimmed = input.trim()
      if (!trimmed) return
      const matched = suggestions.find((t) => t.name === trimmed)
      if (matched) {
        await attachTag(matched)
      } else {
        const created = await createTag(trimmed)
        if (created) await attachTag(created)
      }
    }
    if (e.key === "Escape") {
      setInput("")
      e.currentTarget.blur()
    }
  }

  return (
    <div className="px-6">
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-md py-2 text-sm text-muted-foreground hover:text-foreground"
        onClick={() => setExpanded(!expanded)}
      >
        <span>{t("info")}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 transition-transform", !expanded && "-rotate-90")}
        />
      </button>
      {expanded && (
        <div className="space-y-2 pb-4 pl-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <Tag className="mt-0.5 size-3.5 shrink-0" />
            <div className="flex flex-1 flex-wrap items-center gap-1.5">
              {tags.map((tag) => (
                <Badge key={tag.id} variant="secondary">
                  {tag.name}
                  {!readOnly && (
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => onDetachTag(tag.id)}
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </Badge>
              ))}
              {tags.length === 0 && readOnly && <span>{t("noTags")}</span>}
              {!readOnly && (
                <div className="relative">
                  <input
                    className="h-5 w-32 rounded-4xl bg-muted px-2 text-xs outline-none placeholder:text-muted-foreground/70"
                    placeholder={tags.length === 0 ? t("addTag") : "+"}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    onKeyDown={handleKeyDown}
                  />
                  {focused && suggestions.length > 0 && (
                    <div className="absolute top-6 left-0 z-20 max-h-40 w-40 overflow-y-auto rounded-md border bg-popover py-1 text-popover-foreground shadow-md">
                      {suggestions.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          className="flex w-full items-center px-2 py-1 text-left text-xs hover:bg-accent"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => attachTag(tag)}
                        >
                          <span className="truncate">{tag.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="size-3.5 shrink-0" />
            <span>{t("updatedAt", { time: updatedAt || "--" })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="size-3.5 shrink-0" />
            <span>{t("createdAt", { time: createdAt || "--" })}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default EditorInfo
