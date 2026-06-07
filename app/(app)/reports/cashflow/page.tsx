"use client"

import { useEffect, useState } from "react"
import { Topbar } from "@/components/layout/Topbar"
import { TrendingUp, AlertTriangle, CheckCircle, Clock, Loader2 } from "lucide-react"

interface Forecast {
  expectedNextMonth: number
  latePaymentRisk: "low" | "medium" | "high"
  narrative: string
}

interface CashflowData {
  latePayerAlerts: { client: string; avgDaysLate: number }[]
  dueSoon: { count: number; total: number; dueBy: string }
}

const riskConfig = {
  low: { color: "text-emerald-700 bg-emerald-50 border-emerald-200", Icon: CheckCircle, label: "Low risk" },
  medium: { color: "text-amber-700 bg-amber-50 border-amber-200", Icon: AlertTriangle, label: "Medium risk" },
  high: { color: "text-red-700 bg-red-50 border-red-200", Icon: AlertTriangle, label: "High risk" },
}

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`

export default function CashflowForecastPage() {
  const [forecast, setForecast] = useState<Forecast | null>(null)
  const [data, setData] = useState<CashflowData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const dataRes = await fetch("/api/reports/cashflow-data")
        if (!dataRes.ok) throw new Error("Failed to load cashflow data")
        const raw = await dataRes.json()
        setData({ latePayerAlerts: raw.latePayerAlerts, dueSoon: raw.dueSoon })

        const res = await fetch("/api/ai/cashflow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(raw),
        })
        if (!res.ok) throw new Error("AI forecast failed")
        setForecast(await res.json())
      } catch (e) {
        setError(String(e))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Cashflow Forecast" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 pb-20 md:pb-6">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-gray-900">AI Cashflow Forecast</h2>
        </div>

        {loading && (
          <div className="flex items-center gap-3 text-gray-500 py-16 justify-center">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Analyzing 12 months of payment patterns…</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
        )}

        {/* Expected revenue — shows immediately once data loaded */}
        {forecast && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Expected next 30 days</p>
            <p className="text-4xl font-black text-gray-900">{fmt(forecast.expectedNextMonth)}</p>
          </div>
        )}

        {/* Insight cards — from deterministic data, show as soon as data arrives */}
        {data && (
          <>
            {data.dueSoon.count > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">{data.dueSoon.count} invoice{data.dueSoon.count !== 1 ? "s" : ""} due {data.dueSoon.dueBy}</span>
                  {" "}— {fmt(data.dueSoon.total)} at risk
                </p>
              </div>
            )}

            {data.latePayerAlerts.map((a) => (
              <div key={a.client} className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                <p className="text-sm text-orange-800">
                  <span className="font-semibold">{a.client}</span> typically pays{" "}
                  <span className="font-semibold">{a.avgDaysLate} days late</span>
                </p>
              </div>
            ))}
          </>
        )}

        {/* Risk + narrative */}
        {forecast && (
          <>
            {(() => {
              const { color, Icon, label } = riskConfig[forecast.latePaymentRisk]
              return (
                <div className={`rounded-xl p-4 border flex items-center gap-3 ${color}`}>
                  <Icon className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide">Late payment risk</p>
                    <p className="text-sm font-bold">{label}</p>
                  </div>
                </div>
              )
            })()}

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">AI Analysis</p>
              <p className="text-sm text-gray-700 leading-relaxed">{forecast.narrative}</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
