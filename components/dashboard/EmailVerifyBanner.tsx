"use client"

import { useState, useEffect } from "react"
import { X, Mail } from "lucide-react"

const KEY = "bb_email_verify_dismissed"
const MAX_DISMISSALS = 3

export default function EmailVerifyBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const count = Number(localStorage.getItem(KEY) ?? "0")
      if (count < MAX_DISMISSALS) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  function dismiss() {
    setVisible(false)
    try {
      const count = Number(localStorage.getItem(KEY) ?? "0")
      localStorage.setItem(KEY, String(count + 1))
    } catch { /* ignore */ }
  }

  if (!visible) return null

  return (
    <div className="mx-4 mt-3 flex items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
      <div className="flex items-center gap-2.5">
        <Mail className="h-4 w-4 text-blue-500 shrink-0" />
        <p className="text-sm text-blue-800">
          <span className="font-semibold">Verify your email</span> to unlock invoice sending &amp; payment collection
        </p>
      </div>
      <button
        onClick={dismiss}
        className="text-blue-400 hover:text-blue-600 transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
