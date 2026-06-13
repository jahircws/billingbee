"use client"

import { useEffect, useState } from "react"
import { TrendingUp, Sparkles, Info } from "lucide-react"
import type { HealthComponents } from "@/lib/health"

interface Props {
  score: HealthComponents
}

export default function HealthCard({ score }: Props) {
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // The score is recomputed server-side from the session; no need to send it.
    fetch("/api/ai/health", { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        setRecommendations(d.recommendations ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const color =
    score.total >= 80
      ? { text: "text-emerald-600", bg: "bg-emerald-50", bar: "bg-emerald-500", ring: "border-emerald-200" }
      : score.total >= 60
      ? { text: "text-amber-600", bg: "bg-amber-50", bar: "bg-amber-400", ring: "border-amber-200" }
      : { text: "text-red-600", bg: "bg-red-50", bar: "bg-red-400", ring: "border-red-200" }

  const bars = [
    { label: "Collection", value: score.collectionEfficiency, max: 25 },
    { label: "Growth", value: score.revenueGrowth, max: 20 },
    { label: "Diversification", value: score.clientConcentration, max: 20 },
    { label: "Cashflow", value: score.cashflowRisk, max: 20 },
    { label: "Velocity", value: score.paymentVelocity, max: 15 },
  ]

  return (
    <div className={`bg-white rounded-2xl border ${color.ring} overflow-hidden`}>
      <div className={`${color.bg} px-5 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <TrendingUp className={`w-4 h-4 ${color.text}`} />
          <span className="text-sm font-semibold text-gray-700">Business Health</span>
          <span className="text-[10px] font-medium text-gray-400">({score.baseCurrency})</span>
        </div>
        <div className={`text-2xl font-black ${color.text}`}>
          {score.total}<span className="text-base font-medium text-gray-400">/100</span>
        </div>
      </div>

      {score.limitedData && (
        <div className="px-5 pt-3">
          <div className="flex items-start gap-1.5 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
            <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700">
              Limited data — this score may not be reliable yet. {score.limitedDataReason}.
            </p>
          </div>
        </div>
      )}

      {/* Score bars */}
      <div className="px-5 py-3 grid grid-cols-5 gap-2">
        {bars.map((b) => (
          <div key={b.label} className="space-y-1">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${color.bar} rounded-full`}
                style={{ width: `${(b.value / b.max) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 text-center truncate">{b.label}</p>
          </div>
        ))}
      </div>

      {/* AI recommendations */}
      <div className="px-5 pb-4 space-y-2">
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-xs font-semibold text-gray-600">AI Recommendations</span>
        </div>
        {loading ? (
          <div className="space-y-1.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-3 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          recommendations.slice(0, 3).map((rec, i) => (
            <div key={i} className="flex gap-2 text-xs text-gray-600">
              <span className="shrink-0 text-emerald-500 font-bold">{i + 1}.</span>
              <span>{rec}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
