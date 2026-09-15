import { create } from "zustand"

import { getErrorMessage } from "@/api/tauri-bridge/helper"
import {
  createAndSwitchWorkspace,
  createWorkspace,
  getCurrentWorkspace,
  renameWorkspace,
  switchWorkspace,
  type Workspace,
} from "@/api/tauri-bridge/workspace"

interface WorkspaceState {
  currentWid: number | null
  currentWorkspace: Workspace | null
  loading: boolean
  error: string | null
}

interface WorkspaceActions {
  /** Initialize workspace from backend (call on app mount) */
  initialize: () => Promise<void>
  /** Switch to a workspace by id */
  switchTo: (id: number) => Promise<void>
  /** Create a new workspace without switching */
  create: (name: string) => Promise<Workspace>
  /** Create a new workspace and switch to it */
  createAndSwitch: (name: string) => Promise<void>
  /** Refresh current workspace info from backend */
  refresh: () => Promise<void>
  /** Rename current workspace */
  rename: (id: number, name: string) => Promise<Workspace>
}

export type WorkspaceStore = WorkspaceState & WorkspaceActions

/** Runs an async action with standardized loading/error state management. */
async function withLoading<R>(
  set: (partial: Partial<WorkspaceState>) => void,
  action: () => Promise<R>
): Promise<R> {
  set({ loading: true, error: null })
  try {
    const result = await action()
    set({ loading: false })
    return result
  } catch (err) {
    const message = getErrorMessage(err)
    set({ loading: false, error: message })
    throw err
  }
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  currentWid: null,
  currentWorkspace: null,
  loading: false,
  error: null,

  initialize: async () => {
    const ws = await withLoading(set, () => getCurrentWorkspace())
    set({ currentWid: ws.id, currentWorkspace: ws })
  },

  switchTo: async (id: number) => {
    const ws = await withLoading(set, () => switchWorkspace(id))
    set({ currentWid: ws.id, currentWorkspace: ws })
  },

  create: async (name: string) => {
    return withLoading(set, () => createWorkspace(name))
  },

  createAndSwitch: async (name: string) => {
    const ws = await withLoading(set, () => createAndSwitchWorkspace(name))
    set({ currentWid: ws.id, currentWorkspace: ws })
  },

  refresh: async () => {
    const ws = await withLoading(set, () => getCurrentWorkspace())
    set({ currentWid: ws.id, currentWorkspace: ws })
  },

  rename: async (id: number, name: string) => {
    const ws = await withLoading(set, () => renameWorkspace(id, name))
    set({ currentWorkspace: ws, currentWid: ws.id })
    return ws
  },
}))

/** Convenience hook to get current workspace ID */
export function useCurrentWid(): number | null {
  return useWorkspaceStore((s) => s.currentWid)
}

/** Convenience hook to get current workspace */
export function useCurrentWorkspace(): Workspace | null {
  return useWorkspaceStore((s) => s.currentWorkspace)
}

/**
 * Ensure workspace ID is available in the store.
 * Calls getCurrentWorkspace only if currentWid is null/undefined/0.
 */
export async function ensureWorkspaceReady(): Promise<number> {
  const state = useWorkspaceStore.getState()
  if (state.currentWid) {
    return state.currentWid
  }
  const ws = await getCurrentWorkspace()
  useWorkspaceStore.setState({ currentWid: ws.id, currentWorkspace: ws })
  return ws.id
}
