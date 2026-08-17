import { useRef, useState } from "react"

import { save } from "@tauri-apps/plugin-dialog"
import { writeTextFile } from "@tauri-apps/plugin-fs"

import {
  Download,
  FileCode,
  FileText,
  Lock,
  LockOpen,
  MoreHorizontal,
  RotateCcw,
  Star,
  Trash2,
  Upload,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import ConfirmDialog from "@/components/common/ConfirmDialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/toast"
import { truncateAdvanced } from "@/lib/str"
import { cn } from "@/lib/utils"

interface EditorTitleBarProps {
  title: string
  isFavorite: boolean
  isLock: boolean
  isDelete: boolean
  onToggleFavorite: () => void
  onToggleLock: () => void
  onMoveToTrash: () => Promise<void>
  onTrashConfirmed: () => void
  onRestore: () => Promise<void>
  onRestoreConfirmed?: () => void
  onDeletePermanently: () => Promise<void>
  editor: any
}

function EditorTitleBar({
  title,
  isFavorite,
  isLock,
  isDelete,
  onToggleFavorite,
  onToggleLock,
  onMoveToTrash,
  onTrashConfirmed,
  onRestore,
  onRestoreConfirmed,
  onDeletePermanently,
  editor,
}: EditorTitleBarProps) {
  const [trashConfirmOpen, setTrashConfirmOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false)
  const { t } = useTranslation("editor")
  const importInputRef = useRef<HTMLInputElement>(null)
  const importFormatRef = useRef<"html" | "markdown">("html")

  const handleExportHTML = async () => {
    if (!editor) return
    const html = editor.blocksToHTMLLossy(editor.document)
    const filePath = await save({
      title: t("exportAsHTML"),
      defaultPath: `${title || "untitled"}.html`,
      filters: [{ name: "HTML", extensions: ["html"] }],
    })
    if (filePath) {
      await writeTextFile(filePath, html)
    }
  }

  const handleExportMarkdown = async () => {
    if (!editor) return
    const markdown = editor.blocksToMarkdownLossy(editor.document)
    const filePath = await save({
      title: t("exportAsMarkdown"),
      defaultPath: `${title || "untitled"}.md`,
      filters: [{ name: "Markdown", extensions: ["md"] }],
    })
    if (filePath) {
      await writeTextFile(filePath, markdown)
    }
  }

  const ACCEPT_MAP: Record<string, string> = {
    html: ".html,.htm",
    markdown: ".md,.markdown",
  }

  const handleImportClick = (format: "html" | "markdown") => {
    importFormatRef.current = format
    if (importInputRef.current) {
      importInputRef.current.accept = ACCEPT_MAP[format]
    }
    importInputRef.current?.click()
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return

    const format = importFormatRef.current
    const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
    const validExts = format === "html" ? ["html", "htm"] : ["md", "markdown"]

    if (!validExts.includes(ext)) {
      toast.add({
        title: t("common:operationFailed"),
        description: t("importFormatError"),
        type: "error",
      })
      e.target.value = ""
      return
    }

    const content = await file.text()
    const blocks =
      format === "html"
        ? editor.tryParseHTMLToBlocks(content)
        : editor.tryParseMarkdownToBlocks(content)

    editor.replaceBlocks(editor.document, blocks)
    e.target.value = ""
  }

  return (
    <div className="sticky top-0 z-10 flex h-12 shrink-0 items-center bg-background px-6">
      <h2 className="flex-1 truncate text-sm">
        {truncateAdvanced(title, { maxLength: 12, wordBoundary: true })}
      </h2>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={onToggleFavorite} disabled={isLock}>
          <Star className={cn("size-4", isFavorite && "fill-yellow-400 text-yellow-400")} />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={onToggleLock}>
              {isLock ? <LockOpen className="size-4" /> : <Lock className="size-4" />}
              {isLock ? t("unlockDoc") : t("lockDoc")}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="mx-2" />
            {!isDelete && (
              <>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Download className="size-4" />
                    {t("export")}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={handleExportHTML}>
                      <FileCode className="size-4" />
                      HTML
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportMarkdown}>
                      <FileText className="size-4" />
                      Markdown
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                {!isLock && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Upload className="size-4" />
                      {t("import")}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => handleImportClick("html")}>
                        <FileCode className="size-4" />
                        HTML
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleImportClick("markdown")}>
                        <FileText className="size-4" />
                        Markdown
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                )}
                <DropdownMenuSeparator className="mx-2" />
              </>
            )}
            {isDelete ? (
              <>
                <DropdownMenuItem onClick={() => setRestoreConfirmOpen(true)} disabled={isLock}>
                  <RotateCcw className="size-4" />
                  {t("restoreDoc")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleteConfirmOpen(true)}
                  disabled={isLock}
                >
                  <Trash2 className="size-4" />
                  {t("deletePermanently")}
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setTrashConfirmOpen(true)}
                disabled={isLock}
              >
                <Trash2 className="size-4" />
                {t("moveToTrash")}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmDialog
        open={trashConfirmOpen}
        onOpenChange={setTrashConfirmOpen}
        title={t("moveToTrashTitle")}
        description={t("moveToTrashDesc", { title })}
        destructive
        onConfirm={onMoveToTrash}
        onSuccess={onTrashConfirmed}
      />

      <ConfirmDialog
        open={restoreConfirmOpen}
        onOpenChange={setRestoreConfirmOpen}
        title={t("restoreDocTitle")}
        description={t("restoreDocDesc", { title })}
        onConfirm={onRestore}
        onSuccess={onRestoreConfirmed}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={t("deletePermanentlyTitle")}
        description={t("deletePermanentlyDesc", { title })}
        destructive
        onConfirm={onDeletePermanently}
        onSuccess={onTrashConfirmed}
      />

      <input ref={importInputRef} type="file" onChange={handleImportFile} className="hidden" />
    </div>
  )
}

export default EditorTitleBar
