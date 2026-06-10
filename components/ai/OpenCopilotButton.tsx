"use client"

import { Sparkles } from "lucide-react"

export default function OpenCopilotButton({ label = "Ask AI to create one", className }: { label?: string; className?: string }) {
  function handleClick() {
    window.dispatchEvent(new CustomEvent("bb:open-copilot"))
  }

  return (
    <button
      onClick={handleClick}
      className={className ?? "inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-150"}
    >
      <Sparkles className="w-4 h-4" />
      {label}
    </button>
  )
}
