"use client"

import { useState } from "react"
import { CheckCircle2, TrendingUp, AlertTriangle } from "lucide-react"
import Link from "next/link"

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
          {limit === null ? "Unlimited" : `${current} / ${limit}`}
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
  const [error, setError] = useState<string | null>(null)
  const isPro = org.plan === "pro" || org.plan === "business"
  const isBusiness = org.plan === "business"

  const planExpiry = org.planExpiry ? new Date(org.planExpiry) : null
  const daysLeft = planExpiry
    ? Math.max(0, Math.ceil((planExpiry.getTime() - Date.now()) / 86400000))
    : null

  // Is this a trial? Trial = pro plan with expiry in the future that was set by admin (not Stripe)
  // We treat planExpiry as trial if org has no stripeCustomerId — handled server-side, so we just
  // show countdown if plan=pro and daysLeft is set
  const isTrial = isPro && daysLeft !== null && daysLeft < 90
  const isExpiringSoon = isTrial && daysLeft <= 7

  async function handleUpgrade() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? "Failed to start checkout. Please try again.")
        setLoading(false)
      }
    } catch {
      setError("Network error. Please try again.")
      setLoading(false)
    }
  }

  async function handlePortal() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? "Failed to open billing portal. Please try again.")
        setLoading(false)
      }
    } catch {
      setError("Network error. Please try again.")
      setLoading(false)
    }
  }

  const planLabel = isBusiness ? "Business" : isPro ? "Pro" : "Free"

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-gray-900">Plan &amp; billing</h2>

      {/* Trial expiry warning banner */}
      {isExpiringSoon && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Your free Pro trial ends in {daysLeft} day{daysLeft !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Upgrade now to keep unlimited invoices, AI follow-ups, and more.
            </p>
          </div>
        </div>
      )}

      {/* Current plan card */}
      <div className={`rounded-xl p-5 border ${isPro ? "bg-emerald-50 border-emerald-200" : "bg-white border-gray-200"}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <TrendingUp className={`w-5 h-5 ${isPro ? "text-emerald-600" : "text-gray-400"}`} />
            <span className="font-bold text-gray-900 text-lg">{planLabel}</span>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            isPro ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
          }`}>
            {isPro ? "Active" : "Free tier"}
          </span>
        </div>

        {/* Trial countdown */}
        {isTrial && daysLeft !== null && (
          <p className="text-sm text-emerald-700 mt-1 font-medium">
            {daysLeft} day{daysLeft !== 1 ? "s" : ""} of free Pro remaining
          </p>
        )}

        {/* Paid pro — next billing */}
        {isPro && !isTrial && planExpiry && (
          <p className="text-sm text-gray-600 mt-1">
            Current plan: {planLabel} · Next billing:{" "}
            <span className="font-medium">{planExpiry.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </p>
        )}

        {!isPro && (
          <p className="text-sm text-gray-500 mt-1">
            Limited to {FREE_LIMITS.invoices} invoices/month and {FREE_LIMITS.clients} clients
          </p>
        )}
      </div>

      {/* Usage bars */}
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

      {/* Error */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Actions */}
      {isPro ? (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handlePortal}
            disabled={loading}
            className="text-sm border border-gray-200 text-gray-700 font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            {loading ? "Loading…" : "Manage billing →"}
          </button>
          <button
            onClick={handlePortal}
            disabled={loading}
            className="text-sm border border-red-100 text-red-500 font-semibold px-4 py-2.5 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-60"
          >
            Cancel plan
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            {[
              "Unlimited invoices & clients",
              "AI collections & follow-ups",
              "Payment links (Stripe, Razorpay, PayPal)",
              "PDF without watermark",
              "White-label client portal",
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
          <p className="text-center text-xs text-gray-400">
            Cancel anytime · {" "}
            <Link href="/plans-price" className="underline hover:text-gray-600">Compare all plans</Link>
          </p>
        </div>
      )}
    </div>
  )
}
