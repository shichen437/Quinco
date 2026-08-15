import { invoke } from "@tauri-apps/api/core"

export interface Workspace {
  id: number
  name: string
  isCurrent: number
  type: string
}

export async function listWorkspaces(): Promise<Workspace[]> {
  return invoke<Workspace[]>("workspace_list")
}

export async function getCurrentWorkspace(): Promise<Workspace | null> {
  return invoke<Workspace | null>("workspace_current")
}

export async function createWorkspace(name: string): Promise<Workspace> {
  return invoke<Workspace>("workspace_create", { name })
}

export async function switchWorkspace(id: number): Promise<Workspace> {
  return invoke<Workspace>("workspace_switch", { id })
}

export async function deleteWorkspace(id: number): Promise<void> {
  return invoke<void>("workspace_delete", { id })
}
