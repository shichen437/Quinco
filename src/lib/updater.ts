import { getVersion } from "@tauri-apps/api/app"
import { relaunch } from "@tauri-apps/plugin-process"
import { check, type Update } from "@tauri-apps/plugin-updater"

export type { Update }

export interface DownloadProgress {
  phase: "downloading" | "installing"
  downloaded: number
  contentLength: number | null
}

export type DownloadCallback = (progress: DownloadProgress) => void

export async function getCurrentVersion(): Promise<string> {
  try {
    return await getVersion()
  } catch {
    return ""
  }
}

export async function checkForUpdate(): Promise<Update | null> {
  try {
    const update = await check()
    if (update) {
      return update
    }
    return null
  } catch {
    return null
  }
}

export async function downloadUpdate(update: Update, onProgress?: DownloadCallback): Promise<void> {
  let downloaded = 0
  let contentLength: number | null = null

  await update.downloadAndInstall((event) => {
    switch (event.event) {
      case "Started":
        contentLength = event.data.contentLength ?? null
        onProgress?.({ phase: "downloading", downloaded: 0, contentLength })
        break
      case "Progress":
        downloaded += event.data.chunkLength
        onProgress?.({ phase: "downloading", downloaded, contentLength })
        break
      case "Finished":
        onProgress?.({
          phase: "installing",
          downloaded: contentLength ?? downloaded,
          contentLength,
        })
        break
    }
  })
}

export async function restartApp(): Promise<void> {
  await relaunch()
}
