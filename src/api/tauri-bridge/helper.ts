import { invoke } from "@tauri-apps/api/core"

import { toast } from "@/components/ui/toast"
import { ensureWorkspaceReady } from "@/stores/workspaceStore"

export interface ApiError {
  code: string
  message: string
}

export function parseError(err: unknown): ApiError | string {
  if (typeof err === "string" && err.trim() !== "") {
    try {
      const parsed = JSON.parse(err) as Partial<ApiError>
      if (parsed && typeof parsed.code === "string" && typeof parsed.message === "string") {
        return { code: parsed.code, message: parsed.message }
      }
    } catch {}
    return err
  }
  if (err instanceof Error) {
    return err.message
  }
  // 幂等：已是 { code, message } 形态的对象（例如 call() 归一化后再次
  // 传入 notifyError / getErrorMessage）时直接识别，避免 String(obj) 变成 [object Object]
  if (err && typeof err === "object") {
    const { code, message } = err as Partial<ApiError>
    if (typeof message === "string") {
      return { code: typeof code === "string" ? code : "UNKNOWN", message }
    }
  }
  return String(err ?? "Unknown error")
}

export function getErrorMessage(err: unknown): string {
  const normalized = parseError(err)
  return typeof normalized === "string" ? normalized : normalized.message
}

export function notifyError(err: unknown): void {
  toast.add({
    type: "error",
    title: getErrorMessage(err),
    timeout: 6000,
  })
}

export function call<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  return invoke<T>(cmd, args).catch((err: unknown) => {
    const normalized = parseError(err)
    notifyError(normalized)
    return Promise.reject(normalized)
  })
}

/**
 * Invoke a Tauri command that requires a workspace ID.
 * Automatically resolves the current workspace before calling.
 */
export async function callWithWorkspace<T>(
  cmd: string,
  args: Record<string, unknown> = {}
): Promise<T> {
  const wid = await ensureWorkspaceReady()
  return call<T>(cmd, { wid, ...args })
}
