import { Files, NetworkIcon, SearchIcon, SquarePen } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Kbd } from "@/components/ui/kbd"

function WelcomePage() {
  const { t } = useTranslation("home")

  const shortcuts = [
    { label: t("quickSearch"), icon: SearchIcon, kbd: ["⌘", "⌥", "K"] },
    { label: t("allDocs"), icon: Files, kbd: ["⌘", "⌥", "A"] },
    { label: t("newDoc"), icon: SquarePen, kbd: ["⌘", "⌥", "N"] },
    { label: t("graph"), icon: NetworkIcon, kbd: ["⌘", "⌥", "G"] },
  ] as const

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <Empty className="border-0">
        <EmptyHeader>
          <EmptyTitle>{t("welcome")}</EmptyTitle>
          <EmptyDescription>{t("welcomeDesc")}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="grid w-full items-center gap-y-3">
            {shortcuts.map((s) => (
              <div key={s.label} className="col-span-2 grid grid-cols-subgrid items-center">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <s.icon className="size-4 shrink-0" />
                  {s.label}
                </span>
                <div className="inline-flex justify-end items-center gap-1">
                  {s.kbd.map((key) => (
                    <Kbd key={key}>{key}</Kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </EmptyContent>
      </Empty>
    </div>
  )
}

export default WelcomePage
