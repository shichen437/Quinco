import "@blocknote/core/fonts/inter.css"

import type { PartialBlock } from "@blocknote/core"
import {
  BlockNoteSchema,
  createHeadingBlockSpec,
  defaultBlockSpecs,
  defaultInlineContentSpecs,
} from "@blocknote/core"
import { en, zh } from "@blocknote/core/locales"
import { SuggestionMenuController, useCreateBlockNote } from "@blocknote/react"
import { BlockNoteView } from "@blocknote/shadcn"
import { autoPlacement, offset, shift, size } from "@floating-ui/react"

import "@blocknote/shadcn/style.css"

import { useEffect, useRef, useState } from "react"

import { uploadFile } from "@/api/file"
import { useSettingsStore } from "@/store/settingsStore"

import { DocReferenceMenu, getDocReferenceMenuItems, QuincoDoc } from "./extensions/QuincoDoc"
import { QuincoDocCard } from "./extensions/QuincoDocCard"

interface BlockNoteProps {
  initialBlocks?: PartialBlock[]
  onSave?: (blocks: PartialBlock[]) => void
  editable?: boolean
  docId?: string
  onEditorReady?: (editor: any) => void
}

export default function BlockNote({
  initialBlocks,
  onSave,
  editable = true,
  docId,
  onEditorReady,
}: BlockNoteProps) {
  const { audio: _audio, video: _video, file: _file, ...remainingBlockSpecs } = defaultBlockSpecs
  const schema = BlockNoteSchema.create({
    blockSpecs: {
      ...remainingBlockSpecs,
      heading: createHeadingBlockSpec({
        allowToggleHeadings: false,
        levels: [1, 2, 3],
      }),
      quincoDocCard: QuincoDocCard(),
    },
    inlineContentSpecs: {
      ...defaultInlineContentSpecs,
      quincoDoc: QuincoDoc,
    },
  })

  const lang = useSettingsStore((s) => s.lang)
  const resolvedTheme = useSettingsStore((s) => s.resolvedTheme)
  const dictionary = lang === "en" ? en : zh

  const editor = useCreateBlockNote({
    schema,
    dictionary,
    initialContent: initialBlocks && initialBlocks.length > 0 ? initialBlocks : undefined,
    uploadFile,
  })

  const [saveEnabled, setSaveEnabled] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setSaveEnabled(true), 350)
    return () => clearTimeout(timer)
  }, [])

  const prevContentRef = useRef<string>("")
  const onEditorReadyRef = useRef(onEditorReady)
  onEditorReadyRef.current = onEditorReady

  useEffect(() => {
    if (editor && onEditorReadyRef.current) {
      onEditorReadyRef.current(editor)
    }
  }, [editor])

  useEffect(() => {
    if (!editor) return

    const unsubscribe = editor.onChange(() => {
      if (!saveEnabled) return

      const blocks = editor.document
      const content = JSON.stringify(blocks)

      if (content !== prevContentRef.current) {
        prevContentRef.current = content
        // 下游按 JSON 结构处理 blocks，此处放宽为默认 PartialBlock 类型
        onSave?.(blocks as unknown as PartialBlock[])
      }
    })

    return () => {
      unsubscribe()
    }
  }, [editor, onSave, saveEnabled])

  return (
    <BlockNoteView editor={editor} shadCNComponents={{}} editable={editable} theme={resolvedTheme}>
      <SuggestionMenuController
        triggerCharacter="[["
        getItems={async (query) => getDocReferenceMenuItems(editor, query, docId)}
        suggestionMenuComponent={DocReferenceMenu}
        floatingUIOptions={{
          // 默认 offset 为 10px，面板距光标过远，收紧到 4px
          useFloatingOptions: {
            middleware: [
              offset(4),
              autoPlacement({ allowedPlacements: ["bottom-start", "top-start"], padding: 10 }),
              shift(),
              size({
                apply({ elements, availableHeight }) {
                  elements.floating.style.maxHeight = `${Math.max(0, availableHeight)}px`
                },
                padding: 10,
              }),
            ],
          },
        }}
      />
    </BlockNoteView>
  )
}
