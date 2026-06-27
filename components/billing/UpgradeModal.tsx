"use client"

import { useState } from "react"
import Link from "next/link"
import { Sparkles, X, CheckCircle2 } from "lucide-react"

interface Props {
  current: number
  limit: number
  type: "invoice" | "client"
  onClose: () => void
  isIndia?: boolean
}

const FEATURES = [
  "Unlimited invoices & clients",
  "AI collections & follow-ups",
  "Payment links (Stripe, Razorpay, PayPal)",
  "PDF without watermark",
  "Priority support",
]

export default function UpgradeModal({ current, limit, type, onClose, isIndia }: Props) {
  const [upgradeLoading, setUpgradeLoading] = useState(false)

  async function handleRazorpayUpgrade() {
    setUpgradeLoading(true)
    try {
      const res = await fetch("/api/payments/razorpay-subscription/create", { method: "POST" })
      const data = await res.json()
      if (!res.ok) { setUpgradeLoading(false); return }

      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.async = true
      document.body.appendChild(script)
      script.onload = () => {
        const options = {
          key: data.key,
          subscription_id: data.subscriptionId,
          name: "BillingBee",
          description: "Pro Plan — ₹849/month",
          image: "/logo.png",
          handler: () => { window.location.href = "/settings?tab=plan&upgraded=true" },
          theme: { color: "#10b981" },
          modal: { ondismiss: () => { setUpgradeLoading(false) } },
        }
        // @ts-ignore — Razorpay loaded via script tag
        const rzp = new window.Razorpay(options)
        rzp.open()
        setUpgradeLoading(false)
      }
      script.onerror = () => { setUpgradeLoading(false) }
    } catch {
      setUpgradeLoading(false)
    }
  }
  const heading =
    type === "invoice"
      ? `You've used all ${limit} free invoices this month`
      : `You've reached the ${limit} client limit on Free`

  const subtext =
    type === "invoice"
      ? "Upgrade to Pro for unlimited invoices, AI collections, and more."
      : "Upgrade to Pro for unlimited clients and more."

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
          <h2 className="text-xl font-bold leading-snug">{heading}</h2>
          <p className="text-emerald-100 text-sm mt-1">{subtext}</p>
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
              <p className="text-2xl font-black text-emerald-700">{isIndia ? "₹849" : "$9.99"}</p>
              <p className="text-xs text-gray-500">/ month</p>
            </div>
          </div>
          {isIndia ? (
            <button
              onClick={handleRazorpayUpgrade}
              disabled={upgradeLoading}
              className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-colors text-sm text-center disabled:opacity-60"
            >
              {upgradeLoading ? "Processing…" : "Upgrade to Pro — ₹849/month"}
            </button>
          ) : (
            <Link
              href="/plans-price"
              className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-colors text-sm text-center"
            >
              Upgrade to Pro — $9.99/month
            </Link>
          )}
          <button
            onClick={onClose}
            className="w-full text-slate-500 hover:text-slate-700 text-sm py-1 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}
