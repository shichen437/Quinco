import React from "react"

import ReactDOM from "react-dom/client"

import App from "./app/App"

import "./i18n"

const rootEl = document.getElementById("root") as HTMLElement
const loadingEl = document.getElementById("app-loading")

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

if (loadingEl) {
  const MIN_DISPLAY_MS = 1200
  const startTime = Date.now()

  const fadeOut = () => {
    loadingEl.classList.add("fade-out")
    loadingEl.addEventListener("transitionend", () => loadingEl.remove(), { once: true })
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const elapsed = Date.now() - startTime
      if (elapsed >= MIN_DISPLAY_MS) {
        fadeOut()
      } else {
        setTimeout(fadeOut, MIN_DISPLAY_MS - elapsed)
      }
    })
  })
}
