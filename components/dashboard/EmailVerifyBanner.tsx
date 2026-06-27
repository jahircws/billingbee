"use client"

import { useState, useEffect } from "react"
import { X, Mail, Loader2 } from "lucide-react"

const KEY = "bb_email_verify_dismissed"
const MAX_DISMISSALS = 3

export default function EmailVerifyBanner() {
  const [visible, setVisible] = useState(false)
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")

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

  async function sendVerification() {
    if (status === "sending" || status === "sent") return
    setStatus("sending")
    try {
      const res = await fetch("/api/auth/send-verification", { method: "POST" })
      setStatus(res.ok ? "sent" : "error")
    } catch {
      setStatus("error")
    }
  }

  if (!visible) return null

  return (
    <div className="mx-4 mt-3 flex items-center justify-between gap-3 bg-white border border-slate-200 border-l-4 border-l-emerald-500 rounded-lg px-4 py-3 shadow-sm mb-2">
      <div className="flex items-center gap-2.5">
        <Mail className="h-4 w-4 text-emerald-500 shrink-0" />
        <p className="text-sm text-slate-700">
          {status === "sent" ? (
            "Verification email sent — check your inbox."
          ) : (
            <>
              <button
                onClick={sendVerification}
                disabled={status === "sending"}
                className="font-semibold underline underline-offset-2 hover:text-emerald-700 transition-colors disabled:opacity-60"
              >
                {status === "sending" ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Sending…
                  </span>
                ) : status === "error" ? (
                  "Retry sending verification"
                ) : (
                  "Verify your email"
                )}
              </button>
              <span> to unlock invoice sending &amp; payment collection</span>
            </>
          )}
        </p>
      </div>
      <button
        onClick={dismiss}
        className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
