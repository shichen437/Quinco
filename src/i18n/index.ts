import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import en_common from "./locales/en/common.json"
import en_docs from "./locales/en/docs.json"
import en_editor from "./locales/en/editor.json"
import en_home from "./locales/en/home.json"
import en_setting from "./locales/en/setting.json"
import en_sidebar from "./locales/en/sidebar.json"
import zh_common from "./locales/zh/common.json"
import zh_docs from "./locales/zh/docs.json"
import zh_editor from "./locales/zh/editor.json"
import zh_home from "./locales/zh/home.json"
import zh_setting from "./locales/zh/setting.json"
import zh_sidebar from "./locales/zh/sidebar.json"

export const resources = {
  en: {
    common: en_common,
    sidebar: en_sidebar,
    setting: en_setting,
    editor: en_editor,
    home: en_home,
    docs: en_docs,
  },
  zh: {
    common: zh_common,
    sidebar: zh_sidebar,
    setting: zh_setting,
    editor: zh_editor,
    home: zh_home,
    docs: zh_docs,
  },
} as const

export type AppLanguage = keyof typeof resources

export function initI18n(defaultLang: AppLanguage = "zh") {
  i18n.use(initReactI18next).init({
    resources,
    lng: defaultLang,
    fallbackLng: "en",
    defaultNS: "common",
    ns: ["common", "sidebar", "setting", "editor", "home", "docs"],
    interpolation: {
      escapeValue: false,
    },
  })
  return i18n
}

export default i18n
