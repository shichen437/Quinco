import { useTranslation } from "react-i18next"

import { Kbd, KbdGroup } from "@/components/ui/kbd"

interface ShortcutItem {
  label: string
  keys: string[][]
}

interface ShortcutGroup {
  title: string
  items: ShortcutItem[]
}

function ShortcutsSection() {
  const { t } = useTranslation("setting")

  const groups: ShortcutGroup[] = [
    {
      title: t("shortcutGeneral"),
      items: [
        { label: t("quickSearch"), keys: [["⌘", "⌥", "K"]] },
        { label: t("allDocs"), keys: [["⌘", "⌥", "A"]] },
        { label: t("newDoc"), keys: [["⌘", "⌥", "N"]] },
        { label: t("graph"), keys: [["⌘", "⌥", "G"]] },
        { label: t("goBack"), keys: [["⌘", "["]] },
        { label: t("goForward"), keys: [["⌘", "]"]] },
      ],
    },
    {
      title: t("shortcutEditor"),
      items: [
        { label: t("shortcutInsertDoc"), keys: [["[["]] },
        { label: t("shortcutH1"), keys: [["⌘", "⌥", "1"]] },
        { label: t("shortcutH2"), keys: [["⌘", "⌥", "2"]] },
        { label: t("shortcutH3"), keys: [["⌘", "⌥", "3"]] },
        { label: t("shortcutCollapsible"), keys: [["⌘", "⇧", "6"]] },
        { label: t("shortcutOrderedList"), keys: [["⌘", "⇧", "7"]] },
        { label: t("shortcutBulletList"), keys: [["⌘", "⇧", "8"]] },
        { label: t("shortcutChecklist"), keys: [["⌘", "⇧", "9"]] },
      ],
    },
  ]

  return (
    <div className="flex flex-col gap-6 pt-2">
      {groups.map((group) => (
        <div key={group.title}>
          <h3 className="mb-3 text-sm font-medium text-foreground">{group.title}</h3>
          <div className="rounded-md ">
            {group.items.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4 py-2.5">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <div className="flex items-center gap-2">
                  {item.keys.map((combo, i) => (
                    <KbdGroup key={i}>
                      {combo.map((key) => (
                        <Kbd key={key}>{key}</Kbd>
                      ))}
                    </KbdGroup>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ShortcutsSection
