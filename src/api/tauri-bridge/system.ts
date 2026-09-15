import { call } from "./helper"

export interface DiskUsage {
  path: string
  usedBytes: number
  usedHuman: string
}

export interface SystemInfo {
  appDataPath: string
  diskUsage: DiskUsage
}

export interface Config {
  theme: string
  lang: string
  lastTab: string
  aiEnabled: boolean
  /** JSON-serialized TabSession for restoring open tabs on restart */
  openTabs: string
}

/** Fields that can be updated - all optional for partial updates */
export interface ConfigUpdate {
  theme?: string
  lang?: string
  lastTab?: string
  aiEnabled?: boolean
  /** JSON-serialized TabSession */
  openTabs?: string
}

export async function getDiskUsage(): Promise<SystemInfo> {
  return await call<SystemInfo>("get_disk_usage")
}

export async function getConfig(): Promise<Config> {
  return await call<Config>("get_config_cmd")
}

export async function setConfig(update: ConfigUpdate): Promise<Config> {
  return await call<Config>("set_config_cmd", { config: update })
}

export async function setApiKey(provider: string, apiKey: string): Promise<void> {
  return await call<void>("set_api_key", { providerStr: provider, apiKey })
}

export async function getApiKey(provider: string): Promise<string | null> {
  return await call<string | null>("get_api_key", { providerStr: provider })
}

export async function resetApiKey(provider: string): Promise<void> {
  return await call<void>("reset_api_key", { providerStr: provider })
}

export async function getAllApiKeyStatus(): Promise<Record<string, boolean>> {
  return await call<Record<string, boolean>>("get_all_api_key_status_cmd")
}
