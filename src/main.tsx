import React from "react"

import ReactDOM from "react-dom/client"

import App from "./App"
import { initI18n } from "./i18n"

initI18n("zh")

const SPLASH_MIN_DURATION = 1800

function dismissSplash() {
  const splash = document.getElementById("splash")
  if (!splash) return

  splash.classList.add("fade-out")
  splash.addEventListener(
    "transitionend",
    () => {
      splash.remove()
    },
    { once: true }
  )
}

const splashStart = performance.now()

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

const elapsed = performance.now() - splashStart
const remaining = Math.max(0, SPLASH_MIN_DURATION - elapsed)
setTimeout(dismissSplash, remaining)
