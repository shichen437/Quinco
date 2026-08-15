import { useEffect, useState } from "react"

import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react"
import { SmilePlus, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useSettingsStore } from "@/store/settingsStore"

interface EditorTitleProps {
  title: string
  emoji: string
  isLock: boolean
  isDelete: boolean
  onTitleUpdate: (title: string) => void
  onEmojiUpdate: (emoji: string) => void
}

function EditorTitle({
  title,
  emoji,
  isLock,
  isDelete,
  onTitleUpdate,
  onEmojiUpdate,
}: EditorTitleProps) {
  const readOnly = isLock || isDelete
  const [value, setValue] = useState(title)
  const [pickerOpen, setPickerOpen] = useState(false)
  const resolvedTheme = useSettingsStore((s) => s.resolvedTheme)
  const { t } = useTranslation("editor")

  useEffect(() => {
    setValue(title)
  }, [title])

  const save = () => {
    const trimmed = value.trim()
    if (trimmed && trimmed !== title) {
      onTitleUpdate(trimmed)
    } else {
      setValue(title)
    }
  }

  const handleEmojiClick = (data: EmojiClickData) => {
    onEmojiUpdate(data.emoji)
    setPickerOpen(false)
  }

  return (
    <div className="group px-6 py-2">
      {(emoji || !readOnly) && (
        <div className="mb-2">
          {readOnly ? (
            <span className="text-3xl leading-none">{emoji}</span>
          ) : (
            <div className="relative inline-block">
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger
                  title={emoji ? t("modifyEmoji") : t("addEmoji")}
                  className={cn(
                    "flex size-10 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-accent",
                    !emoji &&
                      !pickerOpen &&
                      "text-muted-foreground opacity-0 group-hover:opacity-100"
                  )}
                >
                  {emoji ? (
                    <span className="text-3xl leading-none">{emoji}</span>
                  ) : (
                    <SmilePlus className="size-5" />
                  )}
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto gap-0 p-0">
                  <EmojiPicker
                    theme={resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT}
                    width={320}
                    height={380}
                    onEmojiClick={handleEmojiClick}
                  />
                </PopoverContent>
              </Popover>
              {emoji && (
                <button
                  type="button"
                  title={t("deleteEmoji")}
                  onClick={() => onEmojiUpdate("")}
                  className="absolute -top-1 -right-1 hidden size-4 cursor-pointer items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-destructive hover:text-destructive-foreground group-hover:flex"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
      <input
        className="w-full bg-transparent text-3xl font-bold tracking-tight outline-none"
        value={value}
        readOnly={readOnly}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            save()
            e.currentTarget.blur()
          }
          if (e.key === "Escape") {
            setValue(title)
            e.currentTarget.blur()
          }
        }}
      />
    </div>
  )
}

export default EditorTitle
