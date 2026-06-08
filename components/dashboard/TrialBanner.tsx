"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import Link from "next/link"

interface Props {
  daysLeft: number
  planExpiry: string // ISO string
}

const DISMISSED_KEY = "bb_trial_banner_dismissed"
const DISMISSED_AT_KEY = "bb_trial_banner_dismissed_at"
const REAPPEAR_DAYS = 7

export default function TrialBanner({ daysLeft, planExpiry }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const dismissedAt = localStorage.getItem(DISMISSED_AT_KEY)
      if (!dismissedAt) {
        setVisible(true)
        return
      }
      const elapsed = (Date.now() - Number(dismissedAt)) / 86400000
      // Reappear if 7 days before expiry OR if more than 7 days since last dismiss
      const expiry = new Date(planExpiry)
      const msUntilExpiry = expiry.getTime() - Date.now()
      const daysUntilExpiry = msUntilExpiry / 86400000
      if (daysUntilExpiry <= REAPPEAR_DAYS) {
        setVisible(true) // always show in final week
      } else if (elapsed >= REAPPEAR_DAYS) {
        setVisible(true)
      }
    } catch {
      setVisible(true)
    }
  }, [planExpiry])

  function dismiss() {
    setVisible(false)
    try {
      localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()))
    } catch { /* ignore */ }
  }

  if (!visible) return null

  return (
    <div className="mx-4 mt-4 flex items-center justify-between gap-4 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3">
      <p className="text-sm text-emerald-800">
        🎉{" "}
        <span className="font-semibold">
          You have {daysLeft} day{daysLeft !== 1 ? "s" : ""} of Pro free
        </span>{" "}
        — enjoy unlimited invoices, AI follow-ups, and more!
      </p>
      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/settings?tab=plan"
          className="text-xs font-semibold text-emerald-700 underline hover:text-emerald-900"
        >
          Upgrade
        </Link>
        <button onClick={dismiss} className="text-emerald-400 hover:text-emerald-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
