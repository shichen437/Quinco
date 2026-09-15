import { useCallback, useEffect, useRef, useState } from "react"

import { Send, StopCircleIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { abortStream, chatStream, createChatSession } from "@/api/tauri-bridge/ai"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { truncate } from "@/lib/string"
import { useAiChatStore } from "@/stores/aiChatStore"
import { ensureWorkspaceReady } from "@/stores/workspaceStore"

import { ModelSelector } from "./ModelSelector"

export function ChatInput() {
  const { t } = useTranslation("home")
  const [input, setInput] = useState("")
  const loading = useAiChatStore((s) => s.loading)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(() => {
    const store = useAiChatStore.getState()
    const trimmed = input.trim()
    if (!trimmed || store.loading) return

    store.addMessage({ role: "user", content: trimmed })
    setInput("")
    store.setLoading(true)

    let aborted = false
    const abortFn = () => {
      aborted = true
      store.setLoading(false)
      store.setAbort(null)
      const currentSid = useAiChatStore.getState().currentSessionId
      if (currentSid) {
        abortStream(currentSid).catch(() => {})
      }
    }
    store.setAbort(abortFn)

    const run = async () => {
      try {
        const wid = await ensureWorkspaceReady()
        let sid = useAiChatStore.getState().currentSessionId
        if (!sid) {
          const session = await createChatSession({
            wid,
            provider: useAiChatStore.getState().selectedProvider ?? "",
            model: useAiChatStore.getState().selectedModel ?? "",
            title: truncate(trimmed, 16),
          })
          sid = session.id
          useAiChatStore.setState({ currentSessionId: session.id })
          store.setSelectedModel(session.provider, session.model)
          useAiChatStore.getState().refreshSessions(wid)
        }
        await chatStream(
          {
            provider: useAiChatStore.getState().selectedProvider ?? null,
            model: useAiChatStore.getState().selectedModel ?? null,
            message: trimmed,
            sid,
            wid,
          },
          {
            onChunk: (text) => {
              if (!aborted) useAiChatStore.getState().streamAppend(text)
            },
            onReasoning: (text) => {
              if (!aborted) useAiChatStore.getState().streamReasoning(text)
            },
            onDone: () => {
              const s = useAiChatStore.getState()
              if (!aborted) {
                s.setLoading(false)
                s.setAbort(null)
              }
            },
            onError: (_err) => {
              if (!aborted) {
                useAiChatStore.getState().setStreamError(t("streamError"))
              }
              const s = useAiChatStore.getState()
              if (!aborted) {
                s.setLoading(false)
                s.setAbort(null)
              }
            },
          }
        )
      } catch (err) {
        if (!aborted && !useAiChatStore.getState().streamError) {
          useAiChatStore.getState().setStreamError(t("requestFailed"))
        }
        const s = useAiChatStore.getState()
        if (!aborted) {
          s.setLoading(false)
          s.setAbort(null)
        }
        console.error("chat_stream invoke error:", err)
      }
    }
    run()
  }, [input, loading])

  const handleStop = useCallback(() => {
    useAiChatStore.getState().abort?.()
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 96)}px`
    }
  }, [input])

  return (
    <div className="border-t bg-background p-0">
      <div className="flex flex-col gap-1 rounded-xl bg-background p-2">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("sendPlaceholder")}
          rows={3}
          className="max-h-18 min-h-18 w-full resize-none border-0 bg-transparent px-2 py-1.5 text-sm shadow-none ring-0 focus-visible:ring-0"
        />
        <div className="flex items-center justify-end gap-2">
          <ModelSelector />
          {loading ? (
            <Button size="icon-sm" variant="ghost" onClick={handleStop} className="size-7">
              <StopCircleIcon className="size-3.5" />
            </Button>
          ) : (
            <Button size="icon-sm" onClick={handleSend} disabled={!input.trim()} className="size-7">
              <Send className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
