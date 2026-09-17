import "@blocknote/core/fonts/inter.css"

import { useEffect, useRef, useState } from "react"

import type { Dictionary, PartialBlock } from "@blocknote/core"
import { en, zh } from "@blocknote/core/locales"
import { useCreateBlockNote } from "@blocknote/react"
import { BlockNoteView } from "@blocknote/shadcn"
import { useTranslation } from "react-i18next"

import "@blocknote/shadcn/style.css"

import { syntaxHighlighter } from "@blocknote/code-block"

import { DocReferenceController } from "./extensions/docReference"
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

  // Pick locale based on current i18n language
  const lang = i18n.language.startsWith("zh") ? "zh" : "en"
  const dictionary = blocknoteLocaleMap[lang]

  // Key forces React to recreate the editor instance when language changes,
  // ensuring BlockNote picks up the new dictionary.
  const editorKey = lang

  // Track the latest editor content so it survives language-switch editor
  // recreation (useCreateBlockNote rebuilds on editorKey change).
  const latestBlocksRef = useRef<PartialBlock[] | undefined>(initialBlocks)
  const prevInitialBlocksRef = useRef(initialBlocks)

  // When the initialBlocks prop changes (new document loaded), sync the ref
  // DURING render so useMemo picks up the correct value.
  if (initialBlocks !== prevInitialBlocksRef.current) {
    prevInitialBlocksRef.current = initialBlocks
    latestBlocksRef.current = initialBlocks
  }

  // Use latestBlocksRef so that when the editor is recreated after a
  // language switch, it is seeded with the most recent editor content
  // rather than the stale initialBlocks passed from the parent.
  const editor = useCreateBlockNote(
    {
      schema,
      dictionary: {
        ...dictionary,
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
        // Keep the ref in sync with the latest editor content so a
        // pending language switch (which recreates the editor) preserves
        // un-saved edits.
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
      slashMenu={true}
      theme={isDark ? "dark" : "light"}
    >
      <DocReferenceController currentDocId={docId} />
    </BlockNoteView>
  )
}
