"use client"

import { useState } from "react"
import { CheckCircle2, TrendingUp } from "lucide-react"

interface Org {
  plan: string
  planExpiry: Date | null
}

interface Props {
  org: Org
  invoiceCount: number
  clientCount: number
}

const FREE_LIMITS = { invoices: 5, clients: 3 }

function UsageBar({ label, current, limit }: { label: string; current: number; limit: number | null }) {
  const pct = limit === null ? 0 : Math.min((current / limit) * 100, 100)
  const isNear = limit !== null && pct >= 80

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className={`font-medium ${isNear ? "text-red-600" : "text-gray-800"}`}>
          {limit === null ? `${current} (unlimited)` : `${current} / ${limit}`}
        </span>
      </div>
      {limit !== null && (
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isNear ? "bg-red-400" : "bg-emerald-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}

export default function PlanTab({ org, invoiceCount, clientCount }: Props) {
  const [loading, setLoading] = useState(false)
  const isPro = org.plan === "pro"

  const daysLeft =
    org.planExpiry
      ? Math.max(0, Math.ceil((new Date(org.planExpiry).getTime() - Date.now()) / 86400000))
      : null

  async function handleUpgrade() {
    setLoading(true)
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setLoading(false)
  }

  async function handlePortal() {
    setLoading(true)
    const res = await fetch("/api/stripe/portal", { method: "POST" })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setLoading(false)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-gray-900">Plan & billing</h2>

      {/* Current plan */}
      <div className={`rounded-xl p-5 border ${isPro ? "bg-emerald-50 border-emerald-200" : "bg-white border-gray-200"}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <TrendingUp className={`w-5 h-5 ${isPro ? "text-emerald-600" : "text-gray-400"}`} />
            <span className="font-bold text-gray-900 text-lg">{isPro ? "Pro" : "Free"}</span>
          </div>
          {isPro && (
            <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2.5 py-1 rounded-full">
              Active
            </span>
          )}
        </div>
        {isPro && daysLeft !== null && daysLeft < 30 && (
          <p className="text-sm text-emerald-700 mt-1">{daysLeft} days remaining on current billing cycle</p>
        )}
        {!isPro && (
          <p className="text-sm text-gray-500 mt-1">Limited to {FREE_LIMITS.invoices} invoices/month and {FREE_LIMITS.clients} clients</p>
        )}
      </div>

      {/* Usage */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Usage this month</h3>
        <UsageBar
          label="Invoices"
          current={invoiceCount}
          limit={isPro ? null : FREE_LIMITS.invoices}
        />
        <UsageBar
          label="Clients"
          current={clientCount}
          limit={isPro ? null : FREE_LIMITS.clients}
        />
      </div>

      {/* CTA */}
      {isPro ? (
        <button
          onClick={handlePortal}
          disabled={loading}
          className="text-sm border border-gray-200 text-gray-700 font-medium px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          {loading ? "Loading…" : "Manage billing →"}
        </button>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            {[
              "Unlimited invoices & clients",
              "AI collections & follow-ups",
              "Payment links (Stripe, Razorpay, PayPal)",
              "PDF without watermark",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-sm text-gray-700">{f}</span>
              </div>
            ))}
          </div>
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-70"
          >
            {loading ? "Redirecting…" : "Upgrade to Pro — $9.99/month"}
          </button>
          <p className="text-center text-xs text-gray-400">Cancel anytime</p>
        </div>
      )}
    </div>
  )
}
