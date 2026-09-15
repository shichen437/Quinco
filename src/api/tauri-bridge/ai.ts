import { Channel, invoke } from "@tauri-apps/api/core"

import { call } from "./helper"

// region:    --- Models

export interface ModelInfo {
  name: string
  adapter_kind: string
}

export interface ProviderModels {
  provider: string
  models: ModelInfo[]
}

export async function listAllAiModels(): Promise<ProviderModels[]> {
  return await invoke<ProviderModels[]>("list_all_ai_models")
}

// endregion: --- Models

// region:    --- Chat Session

export interface ChatSession {
  id: string
  title: string
  model: string
  provider: string
  wid: number
  created_at: string | null
  updated_at: string | null
}

export interface ChatMessage {
  id: number
  sid: string
  role: string
  content: string
  created_at: string | null
}

export interface ChatSessionDetail {
  session: ChatSession
  messages: ChatMessage[]
}

export interface CreateChatSessionParams {
  wid: number
  provider: string
  model: string
  title?: string
}

export function createChatSession(params: CreateChatSessionParams): Promise<ChatSession> {
  return call<ChatSession>("create_chat_session", { req: params })
}

export function listChatSessions(wid: number): Promise<ChatSession[]> {
  return call<ChatSession[]>("list_chat_sessions", { wid })
}

export function getChatSessionData(sid: string): Promise<ChatSessionDetail> {
  return call<ChatSessionDetail>("get_chat_session_data", { sid })
}

export function deleteChatSession(sid: string): Promise<void> {
  return call<void>("delete_chat_session", { sid })
}

// endregion: --- Chat Session

// region:    --- Chat Stream

export type StreamEvent =
  | { type: "chunk"; content: string }
  | { type: "reasoning"; content: string }
  | { type: "done"; usage?: UsageInfo }
  | { type: "error"; message: string }

export interface UsageInfo {
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
}

export interface ChatStreamParams {
  /** null/undefined 表示由后端 auto 选择 provider */
  provider: string | null
  /** null/undefined 表示由后端 auto 选择 model */
  model: string | null
  message: string
  /** 会话 id，必传 */
  sid: string
  /** Workspace the session belongs to; falls back to current workspace when omitted */
  wid?: number
}

export interface ChatStreamCallbacks {
  onChunk: (text: string) => void
  onReasoning?: (text: string) => void
  onDone?: (usage?: UsageInfo) => void
  onError?: (err: unknown) => void
}

export function chatStream(
  params: ChatStreamParams,
  callbacks: ChatStreamCallbacks
): Promise<void> {
  const { onChunk, onReasoning, onDone, onError } = callbacks

  const channel = new Channel<StreamEvent>()
  channel.onmessage = (evt: StreamEvent) => {
    switch (evt.type) {
      case "chunk":
        onChunk(evt.content)
        break
      case "reasoning":
        onReasoning?.(evt.content)
        break
      case "done":
        onDone?.(evt.usage)
        break
      case "error":
        onError?.(evt.message)
        break
    }
  }

  return invoke<void>("chat_stream", { req: params, channel }).catch((err: unknown) => {
    onError?.(err)
    return Promise.reject(err)
  })
}

export function abortStream(sid: string): Promise<void> {
  return invoke<void>("abort_stream", { sid })
}

// endregion: --- Chat Stream
