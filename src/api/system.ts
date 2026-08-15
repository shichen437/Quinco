import { invoke } from "@tauri-apps/api/core"

export async function getDataDir(): Promise<string> {
  return invoke<string>("data_dir")
}

export async function getStorageUsed(): Promise<string> {
  return invoke<string>("storage_used")
}
