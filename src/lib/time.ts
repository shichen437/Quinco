export function formatDateTime(dateStr: string | null, locale = "zh-CN"): string {
  if (!dateStr) return "—"
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return "—"
  return date.toLocaleString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatRelativeTime(dateStr: string | null, locale = "zh-CN"): string {
  if (!dateStr) return ""
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (locale.startsWith("zh")) {
      if (diffMins < 1) return "刚刚"
      if (diffMins < 60) return `${diffMins} 分钟前`
      if (diffHours < 24) return `${diffHours} 小时前`
      if (diffDays < 7) return `${diffDays} 天前`
    } else {
      if (diffMins < 1) return "just now"
      if (diffMins < 60) return `${diffMins} min ago`
      if (diffHours < 24) return `${diffHours} hr ago`
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
    }

    return date.toLocaleDateString(locale, {
      month: "2-digit",
      day: "2-digit",
    })
  } catch {
    return ""
  }
}
