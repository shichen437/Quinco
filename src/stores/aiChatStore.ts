import { create } from "zustand"

import {
  deleteChatSession,
  getChatSessionData,
  listChatSessions,
  type ChatSession,
  type ChatMessage as PersistedChatMessage,
} from "@/api/tauri-bridge/ai"
import { toast } from "@/components/ui/toast"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
}

interface AiChatState {
  open: boolean
  messages: ChatMessage[]
  /** Currently active chat session id (null = new/unsaved chat) */
  currentSessionId: string | null
  /** Chat sessions of the current workspace, shown in the history list */
  sessions: ChatSession[]
  loading: boolean
  abort: (() => void) | null
  selectedProvider: string | null
  selectedModel: string | null
  /** Non-null when the latest stream produced an error (cleared on next send) */
  streamError: string | null
  toggle: () => void
  openPanel: () => void
  closePanel: () => void
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void
  streamAppend: (chunk: string) => void
  streamReasoning: (chunk: string) => void
  setLoading: (loading: boolean) => void
  setAbort: (fn: (() => void) | null) => void
  setStreamError: (msg: string | null) => void
  /** 重置视图开始全新对话（仅清空前端状态，实际会话在首次发消息时创建） */
  startNewSession: () => void
  setCurrentSessionId: (sid: string | null) => void
  /** Load persisted session (meta + messages) and switch into it */
  loadSession: (sid: string) => Promise<void>
  /** List persisted chat sessions of a workspace */
  loadSessionList: (wid: number) => Promise<ChatSession[]>
  /** Fetch and store the chat session list of the given workspace */
  refreshSessions: (wid: number) => Promise<void>
  /** Delete a session; resets the view if it was the active one */
  deleteSession: (sid: string) => Promise<void>
  /** Load a session into the chat view */
  openSession: (sid: string) => Promise<void>
  setSelectedModel: (provider: string | null, model: string | null) => void
}

export const useAiChatStore = create<AiChatState>((set, get) => ({
  open: false,
  messages: [],
  currentSessionId: null,
  sessions: [],
  loading: false,
  abort: null,
  selectedProvider: null,
  selectedModel: null,
  streamError: null,

  toggle: () => set((state) => ({ open: !state.open })),
  openPanel: () => set({ open: true }),
  closePanel: () => set({ open: false }),

  addMessage: (message) =>
    set((state) => ({
      streamError: null, // clear any previous error when user sends new messages
      messages: [
        ...state.messages,
        {
          ...message,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        },
      ],
    })),

  streamAppend: (chunk) =>
    set((state) => {
      const messages = [...state.messages]
      const last = messages[messages.length - 1]
      if (last && last.role === "assistant") {
        messages[messages.length - 1] = {
          ...last,
          content: last.content + chunk,
        }
      } else {
        messages.push({
          id: crypto.randomUUID(),
          role: "assistant",
          content: chunk,
          timestamp: Date.now(),
        })
      }
      return { messages, streamError: null }
    }),

  streamReasoning: (_chunk) => {},

  setLoading: (loading) => set({ loading }),

  setAbort: (fn) => set({ abort: fn }),

  setStreamError: (msg) => {
    if (msg) {
      toast.add({ type: "error", title: msg })
    }
    set({ streamError: msg })
  },

  startNewSession: () => {
    set({
      messages: [],
      currentSessionId: null,
      streamError: null,
    })
  },

  setCurrentSessionId: (sid) => set({ currentSessionId: sid }),

  loadSession: async (sid) => {
    const detail = await getChatSessionData(sid)
    const messages = detail.messages.map(toViewMessage)
    set({
      currentSessionId: detail.session.id,
      messages,
      selectedProvider: detail.session.provider,
      selectedModel: detail.session.model,
      streamError: null,
    })
  },

  loadSessionList: async (wid) => {
    return await listChatSessions(wid)
  },

  refreshSessions: async (wid) => {
    const list = await listChatSessions(wid)
    set({ sessions: list })
  },

  deleteSession: async (sid) => {
    await deleteChatSession(sid)
    set((state) => {
      if (state.currentSessionId === sid) {
        return {
          sessions: state.sessions.filter((s) => s.id !== sid),
          messages: [],
          currentSessionId: null,
          streamError: null,
        }
      }
      return { sessions: state.sessions.filter((s) => s.id !== sid) }
    })
  },

  openSession: async (sid) => {
    await get().loadSession(sid)
  },

  setSelectedModel: (provider, model) => set({ selectedProvider: provider, selectedModel: model }),
}))

function toViewMessage(msg: PersistedChatMessage): ChatMessage {
  return {
    id: String(msg.id),
    role: (msg.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
    content: msg.content,
    timestamp: msg.created_at ? new Date(msg.created_at.replace(" ", "T")).getTime() : Date.now(),
  }
}
