import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { ChevronRight, Loader2, Plus, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  addTagToDoc,
  getDocTags,
  getWorkspaceTags,
  removeTagFromDoc,
  type TagDTO,
} from "@/api/tauri-bridge/tag"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getRandomTagColor, type Tag, type TagColor } from "@/lib/tag_color"
import { formatDateTime } from "@/lib/time"

interface EditorMetadataProps {
  docId: string
  createdAt: string | null
  updatedAt: string | null
}

function toTag(dto: TagDTO): Tag {
  return {
    id: String(dto.id),
    name: dto.name,
    color: dto.color as TagColor,
  }
}

function TagDot({ color }: { color: TagColor }) {
  return (
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ backgroundColor: color }}
    />
  )
}

export default function EditorMetadata({ docId, createdAt, updatedAt }: EditorMetadataProps) {
  const { t: tEditor, i18n } = useTranslation("editor")
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadTags = useCallback(async () => {
    if (!docId) return
    try {
      const [docTags, workspaceTags] = await Promise.all([getDocTags(docId), getWorkspaceTags()])
      setSelectedTags(docTags.map(toTag))
      setAllTags(workspaceTags.map(toTag))
    } catch (err) {
      console.error("Failed to load tags:", err)
    }
  }, [docId])

  useEffect(() => {
    loadTags()
  }, [loadTags])

  const filteredTags = useMemo(() => {
    if (!inputValue.trim()) return allTags.slice(0, 5)
    return allTags
      .filter((tag) => tag.name.toLowerCase().includes(inputValue.toLowerCase()))
      .slice(0, 5)
  }, [inputValue, allTags])

  const hasExactMatch = useMemo(() => {
    return allTags.some((tag) => tag.name.toLowerCase() === inputValue.trim().toLowerCase())
  }, [allTags, inputValue])

  const handleAddTag = async (tag: Tag) => {
    setLoading(true)
    try {
      const dto = await addTagToDoc(docId, tag.name, tag.color)
      const newTag = toTag(dto)
      setSelectedTags((prev) => {
        if (prev.some((t) => t.name === newTag.name)) return prev
        return [...prev, newTag]
      })
      setAllTags((prev) => {
        if (prev.some((t) => t.name === newTag.name)) return prev
        return [...prev, newTag]
      })
      setInputValue("")
    } catch (err) {
      console.error("Failed to add tag:", err)
    } finally {
      setLoading(false)
    }
  }

  const createNewTag = () => {
    const name = inputValue.trim()
    if (!name) return
    const newTag: Tag = {
      name,
      color: getRandomTagColor(),
    }
    handleAddTag(newTag)
  }

  const handleRemoveTag = async (tag: Tag) => {
    const numericId = Number(tag.id)
    if (!numericId) return
    setLoading(true)
    try {
      await removeTagFromDoc(docId, numericId)
      setSelectedTags((prev) => prev.filter((t) => t.id !== tag.id))
    } catch (err) {
      console.error("Failed to remove tag:", err)
    } finally {
      setLoading(false)
    }
  }

  const selectExistingTag = (tag: Tag) => {
    handleAddTag(tag)
  }

  useEffect(() => {
    if (popoverOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [popoverOpen])

  return (
    <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
      <CollapsibleTrigger className="mt-2 px-18 py-2 flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <span>{tEditor("docInfo")}</span>
        <ChevronRight
          className={`h-3 w-3 transition-transform ${detailsOpen ? "rotate-90" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 px-18">
          <div className="flex flex-col px-2 py-2 gap-2 rounded-md bg-muted/50 text-sm text-muted-foreground">
            <div className="flex gap-2">
              <span className="w-16 shrink-0">{tEditor("tagsLabel")}</span>
              <div className="flex min-h-6 flex-1 flex-wrap items-center gap-1.5">
                {selectedTags.map((tag) => (
                  <Badge
                    key={tag.id ?? tag.name}
                    variant="secondary"
                    className="h-5 gap-1.5 rounded-4xl px-2 py-0 text-xs font-normal"
                  >
                    <TagDot color={tag.color} />
                    <span>{tag.name}</span>
                    <button
                      type="button"
                      className="ml-0.5 rounded-full opacity-50 hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveTag(tag)
                      }}
                      disabled={loading}
                      aria-label={tEditor("removeTag", { name: tag.name })}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}

                {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/50" />}

                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger
                    render={(props) => (
                      <button
                        {...props}
                        type="button"
                        disabled={loading}
                        className="inline-flex h-5 items-center gap-1 rounded-4xl border border-dashed border-muted-foreground/40 px-2 text-xs text-muted-foreground hover:border-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                      >
                        <Plus className="h-3 w-3" />
                        <span>{tEditor("addTag")}</span>
                      </button>
                    )}
                  />
                  <PopoverContent className="w-64 p-0" align="start" sideOffset={4}>
                    <Command shouldFilter={false}>
                      <div className="border-b border-border p-2">
                        <CommandInput
                          ref={inputRef}
                          placeholder={tEditor("inputTagName")}
                          value={inputValue}
                          onValueChange={setInputValue}
                          className="h-8"
                        />
                      </div>
                      <CommandList className="max-h-56">
                        {filteredTags.length > 0 && (
                          <CommandGroup>
                            {filteredTags.map((tag) => (
                              <CommandItem
                                key={tag.id ?? tag.name}
                                value={tag.name}
                                onSelect={() => selectExistingTag(tag)}
                                className="gap-2"
                              >
                                <TagDot color={tag.color} />
                                <span className="flex-1 truncate">{tag.name}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}

                        {filteredTags.length === 0 && !inputValue.trim() && (
                          <CommandEmpty className="py-3 text-xs">
                            {tEditor("inputNameSearchOrCreate")}
                          </CommandEmpty>
                        )}

                        {filteredTags.length === 0 && inputValue.trim() && !hasExactMatch && (
                          <CommandItem
                            value={`create-${inputValue}`}
                            onSelect={createNewTag}
                            className="gap-2"
                          >
                            <Plus className="h-3 w-3" />
                            <span>{tEditor("createTag", { name: inputValue.trim() })}</span>
                          </CommandItem>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex gap-2">
              <span className="w-16 shrink-0">{tEditor("createdAt")}</span>
              <span>{formatDateTime(createdAt, i18n.language)}</span>
            </div>
            <div className="flex gap-2">
              <span className="w-16 shrink-0">{tEditor("updatedAt")}</span>
              <span>{formatDateTime(updatedAt, i18n.language)}</span>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
