import { getVersion } from "@tauri-apps/api/app"
import { check } from "@tauri-apps/plugin-updater"

export async function getCurrentVersion(): Promise<string> {
  try {
    return await getVersion()
  } catch {
    return ""
  }
}

export async function getLatestVersion(): Promise<string> {
  try {
    const update = await check()

    if (update?.version) {
      return update.version
    }

    return await getVersion()
  } catch (error) {
    return await getVersion()
  }
}
