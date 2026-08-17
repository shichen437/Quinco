import "@blocknote/core/fonts/inter.css"

import type { PartialBlock } from "@blocknote/core"
import {
  BlockNoteSchema,
  combineByGroup,
  createHeadingBlockSpec,
  defaultBlockSpecs,
  defaultInlineContentSpecs,
} from "@blocknote/core"
import { filterSuggestionItems } from "@blocknote/core/extensions"
import { en, zh } from "@blocknote/core/locales"
import {
  blockTypeSelectItems,
  FormattingToolbar,
  FormattingToolbarController,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
} from "@blocknote/react"
import { BlockNoteView } from "@blocknote/shadcn"
import { autoPlacement, offset, shift, size } from "@floating-ui/react"

import "@blocknote/shadcn/style.css"

import { useEffect, useRef, useState } from "react"

import { syntaxHighlighter } from "@blocknote/code-block"
import {
  createReactInlineMathSpec,
  createReactMathBlockSpec,
  getMathBlockTypeSelectItems,
  getMathSlashMenuItems,
  locales as mathLocales,
} from "@blocknote/math-block"

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
      mathBlock: createReactMathBlockSpec(),
    },
    inlineContentSpecs: {
      ...defaultInlineContentSpecs,
      quincoDoc: QuincoDoc,
      math: createReactInlineMathSpec(),
    },
  })

  const lang = useSettingsStore((s) => s.lang)
  const resolvedTheme = useSettingsStore((s) => s.resolvedTheme)
  const dictionary = lang === "en" ? en : zh

  const editor = useCreateBlockNote({
    schema,
    dictionary: {
      ...dictionary,
      math: mathLocales[lang],
    },
    initialContent: initialBlocks && initialBlocks.length > 0 ? initialBlocks : undefined,
    uploadFile,
    extensions: [syntaxHighlighter],
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
        onSave?.(blocks as unknown as PartialBlock[])
      }
    })

    return () => {
      unsubscribe()
    }
  }, [editor, onSave, saveEnabled])

  return (
    <BlockNoteView
      editor={editor}
      shadCNComponents={{}}
      editable={editable}
      theme={resolvedTheme}
      slashMenu={false}
    >
      <FormattingToolbarController
        formattingToolbar={() => (
          <FormattingToolbar
            blockTypeSelectItems={[
              ...blockTypeSelectItems(editor.dictionary),
              ...getMathBlockTypeSelectItems(editor),
            ]}
          />
        )}
      />
      <SuggestionMenuController
        triggerCharacter={"/"}
        getItems={async (query) => {
          const items = combineByGroup(
            getDefaultReactSlashMenuItems(editor),
            getMathSlashMenuItems(editor)
          )
          return filterSuggestionItems(items, query)
        }}
        floatingUIOptions={{
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
      <SuggestionMenuController
        triggerCharacter="[["
        getItems={async (query) => getDocReferenceMenuItems(editor, query, docId)}
        suggestionMenuComponent={DocReferenceMenu}
        floatingUIOptions={{
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
