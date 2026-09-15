import { useMemo } from "react"

import type { LucideIcon } from "lucide-react"

interface GradientIconProps {
  icon: LucideIcon
  className?: string
  colors?: string[]
}

const defaultColors = ["#4facfe", "#8b5cf6", "#ec4899", "#f97316"]

export function GradientIcon({ icon: Icon, className, colors = defaultColors }: GradientIconProps) {
  const gradientId = useMemo(() => `gi-${Math.random().toString(36).slice(2, 10)}`, [])

  return (
    <span className="relative inline-flex shrink-0 items-center justify-center">
      <Icon className={className} style={{ stroke: `url(#${gradientId})` }} />
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            {colors.map((color, index) => {
              const offset =
                colors.length === 1 ? "100%" : `${(index / (colors.length - 1)) * 100}%`
              return <stop key={color} offset={offset} stopColor={color} />
            })}
          </linearGradient>
        </defs>
      </svg>
    </span>
  )
}

export default GradientIcon
