export const TAG_COLORS = [
  "#ef4444", // red-500
  "#f97316", // orange-500
  "#eab308", // yellow-500
  "#22c55e", // green-500
  "#3b82f6", // blue-500
  "#ec4899", // pink-500
  "#a855f7", // purple-500
  "#6b7280", // gray-500
] as const

export type TagColor = (typeof TAG_COLORS)[number]

export function getTagColorByName(name: string): TagColor {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % TAG_COLORS.length
  return TAG_COLORS[index]
}

export function getRandomTagColor(): TagColor {
  return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]
}

export interface Tag {
  id?: string
  name: string
  color: TagColor
}
