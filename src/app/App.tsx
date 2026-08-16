import { Toaster } from "@/components/ui/toast"
import { TooltipProvider } from "@/components/ui/tooltip"
import HomePage from "@/pages/home/HomePage"

import "../global.css"

function App() {
  return (
    <TooltipProvider>
      <Toaster timeout={7000}>
        <HomePage />
      </Toaster>
    </TooltipProvider>
  )
}

export default App
