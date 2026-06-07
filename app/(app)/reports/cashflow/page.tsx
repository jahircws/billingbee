"use client"

import { useEffect, useState } from "react"
import { Topbar } from "@/components/layout/Topbar"
import { TrendingUp, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"

interface Forecast {
  expectedNextMonth: number
  latePaymentRisk: "low" | "medium" | "high"
  narrative: string
}

const riskColors = {
  low: "text-emerald-600 bg-emerald-50",
  medium: "text-amber-600 bg-amber-50",
  high: "text-red-600 bg-red-50",
}

const riskIcons = {
  low: CheckCircle,
  medium: AlertTriangle,
  high: AlertTriangle,
}

export default function CashflowForecastPage() {
  const [forecast, setForecast] = useState<Forecast | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const dataRes = await fetch("/api/reports/cashflow-data")
        if (!dataRes.ok) throw new Error("Failed to load data")
        const data = await dataRes.json()

        const res = await fetch("/api/ai/cashflow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error("AI forecast failed")
        const json = await res.json()
        setForecast(json)
      } catch (e) {
        setError(String(e))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0 })}`

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Cashflow Forecast" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 pb-20 md:pb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-gray-900">AI Cashflow Forecast</h2>
        </div>

        {loading && (
          <div className="flex items-center gap-3 text-gray-500 py-12 justify-center">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Analyzing your payment patterns…</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {forecast && (
          <div className="space-y-4">
            {/* Expected revenue */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Expected next month</p>
              <p className="text-4xl font-black text-gray-900">{fmt(forecast.expectedNextMonth)}</p>
            </div>

            {/* Risk badge */}
            <div className={`rounded-xl p-4 flex items-center gap-3 ${riskColors[forecast.latePaymentRisk]}`}>
              {(() => { const Icon = riskIcons[forecast.latePaymentRisk]; return <Icon className="w-5 h-5 shrink-0" /> })()}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-0.5">Late payment risk</p>
                <p className="text-sm font-bold capitalize">{forecast.latePaymentRisk}</p>
              </div>
            </div>

            {/* Narrative */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Analysis</p>
              <p className="text-sm text-gray-700 leading-relaxed">{forecast.narrative}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
