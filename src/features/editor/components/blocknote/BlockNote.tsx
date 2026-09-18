import "@blocknote/core/fonts/inter.css"

import { useEffect, useRef, useState } from "react"

import type { Dictionary, PartialBlock } from "@blocknote/core"
import { combineByGroup } from "@blocknote/core"
import { filterSuggestionItems } from "@blocknote/core/extensions"
import { en, zh } from "@blocknote/core/locales"
import { useCreateBlockNote } from "@blocknote/react"
import { BlockNoteView } from "@blocknote/shadcn"
import { useTranslation } from "react-i18next"

import "@blocknote/shadcn/style.css"

import { syntaxHighlighter } from "@blocknote/code-block"
import { getMathBlockTypeSelectItems, getMathSlashMenuItems } from "@blocknote/math-block"
import {
  blockTypeSelectItems,
  FormattingToolbar,
  FormattingToolbarController,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
} from "@blocknote/react"

import { DocReferenceController } from "./extensions/docReference"
import { getMathLocale } from "./locales/mathLocales"
import { blocknoteSchema } from "./schema"

interface BlockNoteProps {
  initialBlocks?: PartialBlock[]
  onSave?: (blocks: PartialBlock[]) => void
  editable?: boolean
  docId?: string
  onEditorReady?: (editor: any) => void
}

function useIsDark() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"))
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])
  return isDark
}

const blocknoteLocaleMap: Record<string, Dictionary> = {
  zh: zh,
  en: en,
}

export default function BlockNote({
  initialBlocks,
  onSave,
  editable = true,
  docId,
  onEditorReady,
}: BlockNoteProps) {
  const { i18n } = useTranslation()
  const schema = blocknoteSchema
  const isDark = useIsDark()

  const lang = i18n.language.startsWith("zh") ? "zh" : "en"
  const dictionary = blocknoteLocaleMap[lang]

  const editorKey = lang

  const latestBlocksRef = useRef<PartialBlock[] | undefined>(initialBlocks)
  const prevInitialBlocksRef = useRef(initialBlocks)

  if (initialBlocks !== prevInitialBlocksRef.current) {
    prevInitialBlocksRef.current = initialBlocks
    latestBlocksRef.current = initialBlocks
  }

  const editor = useCreateBlockNote(
    {
      schema,
      dictionary: {
        ...dictionary,
        math: getMathLocale(lang),
      },
      initialContent:
        latestBlocksRef.current && latestBlocksRef.current.length > 0
          ? latestBlocksRef.current
          : undefined,
      extensions: [syntaxHighlighter],
    },
    [editorKey, initialBlocks]
  )

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
        latestBlocksRef.current = blocks as unknown as PartialBlock[]
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
      editable={editable}
      slashMenu={false}
      formattingToolbar={false}
      theme={isDark ? "dark" : "light"}
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
        triggerCharacter="/"
        getItems={async (query) => {
          const items = combineByGroup(
            getDefaultReactSlashMenuItems(editor),
            getMathSlashMenuItems(editor)
          )
          return filterSuggestionItems(items, query)
        }}
      />
      <DocReferenceController currentDocId={docId} />
    </BlockNoteView>
  )
}
