"use client"

import { useState } from "react"
import { Sparkles, X, CheckCircle2 } from "lucide-react"

interface Props {
  current: number
  limit: number
  type: "invoice" | "client"
  onClose: () => void
}

const FEATURES = [
  "Unlimited invoices & clients",
  "AI collections & follow-ups",
  "Payment links (Stripe, Razorpay, PayPal)",
  "PDF without watermark",
  "Priority support",
]

export default function UpgradeModal({ current, limit, type, onClose }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 py-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Upgrade to Pro</span>
          </div>
          <h2 className="text-2xl font-bold">Unlock unlimited growth</h2>
          <p className="text-emerald-100 text-sm mt-1">
            You&apos;ve used {current}/{limit} {type === "invoice" ? "invoices this month" : "clients"}
          </p>
        </div>

        {/* Features */}
        <div className="px-6 py-5 space-y-3">
          {FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-sm text-gray-700">{f}</span>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="px-6 pb-6 space-y-3">
          <div className="bg-emerald-50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900">Pro Plan</p>
              <p className="text-xs text-gray-500">Everything you need to grow</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-emerald-700">$9.99</p>
              <p className="text-xs text-gray-500">/ month</p>
            </div>
          </div>
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-70 text-sm"
          >
            {loading ? "Redirecting to checkout…" : "Upgrade to Pro — $9.99/month"}
          </button>
          <p className="text-center text-xs text-gray-400">Cancel anytime · No long-term commitment</p>
        </div>
      </div>
    </div>
  )
}
