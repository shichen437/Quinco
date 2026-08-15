import { load } from "@tauri-apps/plugin-store"

const STORE_NAME = "quinco_store.json"

export const STORE_KEYS = {
  theme: "settings.theme",
  lang: "settings.lang",
  lastTab: "settings.lastTab",
} as const

export async function getStoreValue<T>(key: string): Promise<T | null> {
  const store = await load(STORE_NAME)
  return (await store.get<T>(key)) ?? null
}

export async function setStoreValue(key: string, value: unknown): Promise<void> {
  const store = await load(STORE_NAME)
  await store.set(key, value)
  await store.save()
}
