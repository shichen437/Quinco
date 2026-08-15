import { TooltipProvider } from "@/components/ui/tooltip"
import HomePage from "@/pages/home/HomePage"

import "../global.css"

function App() {
  return (
    <TooltipProvider>
      <HomePage />
    </TooltipProvider>
  )
}

export default App
