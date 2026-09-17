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
  initialize: () => Promise<void>
  switchTo: (id: number) => Promise<void>
  create: (name: string) => Promise<Workspace>
  createAndSwitch: (name: string) => Promise<void>
  refresh: () => Promise<void>
  rename: (id: number, name: string) => Promise<Workspace>
}

export type WorkspaceStore = WorkspaceState & WorkspaceActions

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

export function useCurrentWid(): number | null {
  return useWorkspaceStore((s) => s.currentWid)
}

export function useCurrentWorkspace(): Workspace | null {
  return useWorkspaceStore((s) => s.currentWorkspace)
}

export async function ensureWorkspaceReady(): Promise<number> {
  const state = useWorkspaceStore.getState()
  if (state.currentWid) {
    return state.currentWid
  }
  const ws = await getCurrentWorkspace()
  useWorkspaceStore.setState({ currentWid: ws.id, currentWorkspace: ws })
  return ws.id
}
