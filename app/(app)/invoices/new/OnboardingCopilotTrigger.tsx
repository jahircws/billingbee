"use client"

import { useEffect } from "react"

export default function OnboardingCopilotTrigger({ clientName }: { clientName?: string }) {
  useEffect(() => {
    window.dispatchEvent(new Event("bb:open-copilot"))
    if (clientName) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("bb:copilot-set-input", {
          detail: { text: `Create an invoice for ${clientName}` },
        }))
      }, 300)
    }
  }, [clientName])

  return null
}
