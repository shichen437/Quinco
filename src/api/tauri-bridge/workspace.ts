import { call } from "./helper"

export interface Workspace {
  id: number
  name: string
  is_current: number
  type: string
  created_at: string | null
  updated_at: string | null
}

export function getWorkspaces(): Promise<Workspace[]> {
  return call<Workspace[]>("get_all_workspaces")
}

export function getCurrentWorkspace(): Promise<Workspace> {
  return call<Workspace>("get_current_workspace")
}

export function switchWorkspace(id: number): Promise<Workspace> {
  return call<Workspace>("switch_workspace", { id })
}

export function createWorkspace(name: string): Promise<Workspace> {
  return call<Workspace>("create_workspace", { name })
}

export function createAndSwitchWorkspace(name: string): Promise<Workspace> {
  return call<Workspace>("create_and_switch_workspace", { name })
}

export function deleteWorkspace(id: number): Promise<Workspace> {
  return call<Workspace>("delete_workspace", { id })
}

export function renameWorkspace(id: number, name: string): Promise<Workspace> {
  return call<Workspace>("rename_workspace", { id, name })
}

export function resetWorkspace(id: number): Promise<Workspace> {
  return call<Workspace>("reset_workspace", { id })
}
