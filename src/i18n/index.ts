import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import enAllDocs from "./en/allDocs.json"
import enCommon from "./en/common.json"
import enEditor from "./en/editor.json"
import enGraph from "./en/graph.json"
import enHeader from "./en/header.json"
import enSearch from "./en/search.json"
import enSettings from "./en/settings.json"
import enSidebar from "./en/sidebar.json"
import enTrash from "./en/trash.json"
import enWelcome from "./en/welcome.json"
import enWorkspace from "./en/workspace.json"
import zhAllDocs from "./zh/allDocs.json"
import zhCommon from "./zh/common.json"
import zhEditor from "./zh/editor.json"
import zhGraph from "./zh/graph.json"
import zhHeader from "./zh/header.json"
import zhSearch from "./zh/search.json"
import zhSettings from "./zh/settings.json"
import zhSidebar from "./zh/sidebar.json"
import zhTrash from "./zh/trash.json"
import zhWelcome from "./zh/welcome.json"
import zhWorkspace from "./zh/workspace.json"

export type SupportedLang = "zh" | "en"

export const LANG_LABELS: Record<SupportedLang, string> = {
  zh: "简体中文",
  en: "English",
}

i18n.use(initReactI18next).init({
  resources: {
    zh: {
      common: zhCommon,
      sidebar: zhSidebar,
      header: zhHeader,
      editor: zhEditor,
      settings: zhSettings,
      welcome: zhWelcome,
      allDocs: zhAllDocs,
      trash: zhTrash,
      graph: zhGraph,
      workspace: zhWorkspace,
      search: zhSearch,
    },
    en: {
      common: enCommon,
      sidebar: enSidebar,
      header: enHeader,
      editor: enEditor,
      settings: enSettings,
      welcome: enWelcome,
      allDocs: enAllDocs,
      trash: enTrash,
      graph: enGraph,
      workspace: enWorkspace,
      search: enSearch,
    },
  },
  lng: "zh",
  fallbackLng: "zh",
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
