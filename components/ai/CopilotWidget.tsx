"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Sparkles, X, Minus, Bot } from "lucide-react"
import Copilot from "./Copilot"

const SESSION_KEY = "bb_copilot_greeted"

const GST_SUGGESTIONS = [
  "What GST rate applies to software services?",
  "Do I need to register for GST under ₹20L?",
  "What is RCM for import of services?",
  "How to calculate IGST for interstate supply?",
]

export default function CopilotWidget({ username }: { username?: string }) {
  const pathname = usePathname()
  const isGst = pathname === "/tax"

  const [open, setOpen] = useState(false)
  const [minimised, setMinimised] = useState(false)

  useEffect(() => {
    if (!sessionStorage.getItem(SESSION_KEY)) {
      setOpen(true)
      sessionStorage.setItem(SESSION_KEY, "1")
    }
    function handleOpenEvent() {
      setOpen(true)
      setMinimised(false)
    }
    window.addEventListener("bb:open-copilot", handleOpenEvent)
    return () => window.removeEventListener("bb:open-copilot", handleOpenEvent)
  }, [])

  const greeting = isGst
    ? "Hi! I'm your AI GST Assistant. Ask me anything about GST rates, filing, ITC, or compliance in India."
    : username
    ? `Hi ${username}! I'm your BillingBee Copilot. Ask me anything about your invoices, clients, or revenue — or just say "create invoice" to get started.`
    : `Hi! I'm your BillingBee Copilot. Ask me anything about your invoices, clients, or revenue — or just say "create invoice" to get started.`

  const title = isGst ? "AI GST Assistant" : "AI Revenue Copilot"
  const subtitle = isGst ? "India GST expert · Powered by Claude" : "Powered by Claude"
  const apiEndpoint = isGst ? "/api/ai/tax" : "/api/ai/copilot"
  const Icon = isGst ? Bot : Sparkles

  return (
    <>
      {!open && (
        <button
          onClick={() => { setOpen(true); setMinimised(false) }}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg flex items-center justify-center transition-colors"
          aria-label={`Open ${title}`}
        >
          <Icon size={22} />
        </button>
      )}

      {open && (
        <div
          className={`fixed bottom-6 right-6 z-50 w-[380px] bg-white rounded-2xl shadow-2xl border border-emerald-100 flex flex-col overflow-hidden transition-all duration-200 ${
            minimised ? "h-[56px]" : "h-[520px]"
          }`}
        >
          <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Icon size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-tight">{title}</p>
              {!minimised && (
                <p className="text-xs text-emerald-100 leading-tight truncate">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMinimised((m) => !m)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/20 text-white transition-colors"
                aria-label={minimised ? "Expand" : "Minimise"}
              >
                <Minus size={14} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/20 text-white transition-colors"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {!minimised && (
            <div className="flex-1 min-h-0">
              <Copilot
                key={pathname}
                initialMessage={greeting}
                apiEndpoint={apiEndpoint}
                suggestions={isGst ? GST_SUGGESTIONS : undefined}
              />
            </div>
          )}
        </div>
      )}
    </>
  )
}
