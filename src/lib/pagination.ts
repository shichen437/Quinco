export function buildPages(
  current: number,
  total: number
): Array<number | "ellipsis-start" | "ellipsis-end"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const wanted = new Set([1, 2, total - 1, total, current - 1, current, current + 1])
  const sorted = [...wanted].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const pages: Array<number | "ellipsis-start" | "ellipsis-end"> = []
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i]
    if (i === 0) {
      pages.push(p)
      continue
    }
    const gap = p - sorted[i - 1]
    if (gap === 1) {
      pages.push(p)
    } else if (gap === 2) {
      pages.push(sorted[i - 1] + 1, p)
    } else {
      pages.push("ellipsis-start", p)
    }
  }
  return pages
}

export const DEFAULT_PAGE_SIZE = 20
