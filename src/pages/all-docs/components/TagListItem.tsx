import { useEffect, useRef, useState } from "react"

import { Pencil, Tag, Trash2 } from "lucide-react"

import type { TagItem } from "@/api/tag"

interface TagListItemProps {
  tag: TagItem
  onClick: () => void
  onRename: (name: string) => Promise<void>
  onDelete: () => Promise<void>
}

export default function TagListItem({ tag, onClick, onRename, onDelete }: TagListItemProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(tag.name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const startEdit = () => {
    setValue(tag.name)
    setEditing(true)
  }

  const save = async () => {
    setEditing(false)
    const trimmed = value.trim()
    if (trimmed && trimmed !== tag.name) {
      await onRename(trimmed)
    } else {
      setValue(tag.name)
    }
  }

  if (editing) {
    return (
      <div className="flex w-full items-center gap-3 rounded-md px-4 py-2.5">
        <Tag className="size-4 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          className="w-48 rounded border bg-transparent px-1 text-sm outline-none"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save()
            if (e.key === "Escape") {
              setValue(tag.name)
              setEditing(false)
            }
          }}
        />
      </div>
    )
  }

  return (
    <div className="group flex w-full items-center gap-3 rounded-md px-4 py-2.5 hover:bg-accent">
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        onClick={onClick}
      >
        <Tag className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate text-sm">{tag.name}</span>
      </button>
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground"
          onClick={startEdit}
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          type="button"
          className="rounded p-1 text-muted-foreground hover:bg-background hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
