import { FileText } from "lucide-react"

import { cn } from "@/lib/utils"

interface DocIconProps {
  emoji?: string
  className?: string
}

function DocEmojiIcon({ emoji, className }: DocIconProps) {
  if (emoji) {
    return (
      <span
        className={cn("flex shrink-0 items-center justify-center text-sm leading-none", className)}
      >
        {emoji}
      </span>
    )
  }

  return <FileText className={cn("size-4 shrink-0", className)} />
}

export default DocEmojiIcon
