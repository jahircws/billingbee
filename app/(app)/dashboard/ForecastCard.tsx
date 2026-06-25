"use client"

import { useEffect, useState } from "react"
import { TrendingUp, BarChart2 } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"

interface ForecastResponse {
  forecast: string
  hasSufficientData: boolean
  isPro: boolean
  stats: {
    totalOutstanding: number
    overdueCount: number
    avgMonthlyRevenue: number
    dormantClientCount: number
  }
  error?: string
  retryAfterMinutes?: number
}

export default function ForecastCard({ currency }: { currency: string }) {
  const [data, setData] = useState<ForecastResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch("/api/ai/forecast", { method: "POST" })
      .then((r) => r.json())
      .then((json: ForecastResponse) => {
        if (json.error && !json.forecast) {
          setError(true)
        } else {
          setData(json)
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-emerald-500" />
        <h3 className="text-sm font-semibold text-slate-800">Revenue Forecast</h3>
        <span className="bg-purple-50 text-purple-700 border border-purple-200 text-xs rounded-full px-2 py-0.5 ml-1">
          AI
        </span>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-2">
          <div className="animate-pulse bg-slate-100 rounded h-4 w-full" />
          <div className="animate-pulse bg-slate-100 rounded h-4 w-4/5" />
          <div className="animate-pulse bg-slate-100 rounded h-4 w-3/5" />
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <p className="text-sm text-slate-400">Forecast unavailable — check back later.</p>
      )}

      {/* Insufficient data */}
      {!loading && !error && data && !data.hasSufficientData && (
        <div className="flex items-start gap-3">
          <BarChart2 className="w-5 h-5 text-slate-300 mt-0.5 shrink-0" />
          <p className="text-sm text-slate-500 leading-relaxed">{data.forecast}</p>
        </div>
      )}

      {/* Forecast with stats */}
      {!loading && !error && data && data.hasSufficientData && (
        <>
          <p className="text-sm text-slate-700 leading-relaxed mb-4">{data.forecast}</p>

          {/* Stats row — blurred for free users */}
          <div className="relative">
            <div
              className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${!data.isPro ? "blur-sm select-none pointer-events-none" : ""}`}
            >
              <StatItem
                label="Outstanding"
                value={formatCurrency(data.stats.totalOutstanding, currency)}
              />
              <StatItem
                label="Overdue"
                value={
                  data.stats.overdueCount === 0
                    ? "None"
                    : `${data.stats.overdueCount} invoice${data.stats.overdueCount !== 1 ? "s" : ""}`
                }
              />
              <StatItem
                label="Avg / month"
                value={formatCurrency(data.stats.avgMonthlyRevenue, currency)}
              />
              <StatItem
                label="Dormant clients"
                value={String(data.stats.dormantClientCount)}
              />
            </div>

            {!data.isPro && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <p className="text-xs text-slate-600 font-medium text-center">
                  Unlock 90-day forecast + client breakdown
                </p>
                <Link
                  href="/settings/billing"
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
                >
                  Upgrade to Pro →
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
    </div>
  )
}
