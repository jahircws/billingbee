"use client"

import { useState, useEffect } from "react"
import { Check, Share2, X } from "lucide-react"

export default function GenerateSignupBanner() {
  const [visible, setVisible] = useState(false)
  const [payLink, setPayLink] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Show only when coming from /generate signup
    try {
      const acq = JSON.parse(localStorage.getItem("bb_acquisition") ?? "{}")
      if (acq.from === "generate" || acq.source === "seo") {
        setVisible(true)
        // Build a generic payment link placeholder — in prod this resolves to latest invoice
        const base = window.location.origin
        setPayLink(`${base}/invoices`)
      }
    } catch { /* ignore */ }
  }, [])

  function copyLink() {
    navigator.clipboard.writeText(payLink).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(`Here's your invoice payment link: ${payLink}`)
    window.open(`https://wa.me/?text=${text}`, "_blank")
  }

  if (!visible) return null

  return (
    <div className="mx-4 mt-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-sm font-semibold text-emerald-900">Your invoice is saved!</p>
          <p className="text-xs text-emerald-700 mt-0.5">Here&apos;s your payment link �� share it to get paid instantly:</p>
        </div>
        <button onClick={() => setVisible(false)} className="text-emerald-400 hover:text-emerald-600 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex gap-2">
        <button
          onClick={copyLink}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-all duration-150"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : null}
          {copied ? "Copied!" : "Copy payment link"}
        </button>
        <button
          onClick={shareWhatsApp}
          className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1ebe5d] active:scale-95 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-all duration-150"
        >
          <Share2 className="h-3.5 w-3.5" />
          Share on WhatsApp
        </button>
      </div>
    </div>
  )
}
