import { invoke } from "@tauri-apps/api/core"

export async function uploadFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const bytes = Array.from(new Uint8Array(buffer))
  return invoke<string>("file_upload", {
    bytes,
    filename: file.name,
    mimeType: file.type || "application/octet-stream",
  })
}
