import { useTranslation } from "react-i18next"

interface EditorTitleProps {
  title: string
  onChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  disabled?: boolean
}

export default function EditorTitle({ title, onChange, onKeyDown, disabled }: EditorTitleProps) {
  const { t } = useTranslation("common")
  return (
    <div className="shrink-0 w-full px-17.5 pt-2 pb-1">
      <input
        type="text"
        value={title}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={t("unnamed")}
        disabled={disabled}
        className="w-full border-none bg-transparent text-3xl font-bold text-foreground placeholder:text-muted-foreground/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  )
}
