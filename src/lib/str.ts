export function truncate(str: string, maxLength: number, ellipsis: string = "..."): string {
  if (!str || maxLength <= 0) {
    return ""
  }

  if (str.length <= maxLength) {
    return str
  }

  const keepLength = Math.max(0, maxLength - ellipsis.length)

  if (keepLength === 0) {
    return ellipsis
  }

  return str.slice(0, keepLength) + ellipsis
}

interface TruncateOptions {
  /** 最大长度（包含省略号） */
  maxLength: number
  /** 省略号样式，默认 '...' */
  ellipsis?: string
  /** 是否在单词边界截断（仅对英文有效），默认 false */
  wordBoundary?: boolean
}

export function truncateAdvanced(str: string, options: TruncateOptions): string {
  const { maxLength, ellipsis = "...", wordBoundary = false } = options

  if (!str || maxLength <= 0) {
    return ""
  }

  if (str.length <= maxLength) {
    return str
  }

  const keepLength = Math.max(0, maxLength - ellipsis.length)

  if (keepLength === 0) {
    return ellipsis
  }

  let truncated = str.slice(0, keepLength)

  if (wordBoundary) {
    const lastSpaceIndex = truncated.lastIndexOf(" ")
    if (lastSpaceIndex > 0) {
      truncated = truncated.slice(0, lastSpaceIndex)
    }
  }

  return truncated + ellipsis
}
