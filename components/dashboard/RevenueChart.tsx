"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { formatCurrency } from "@/lib/utils"

interface MonthData {
  label: string
  paid: number
  outstanding: number
}

interface Props {
  months: MonthData[]
  currency: string
}

function abbreviateCurrency(value: number, currency: string): string {
  const formatted = formatCurrency(Math.abs(value), currency)
  // Extract the numeric part by stripping known symbol patterns
  // We let formatCurrency produce the symbol, then abbreviate the numeric suffix
  if (value >= 100000) {
    const n = (value / 100000).toFixed(1)
    // Replace the raw number in formatted string with abbreviated form
    return formatted.replace(/[\d,]+(\.\d+)?/, `${n}L`)
  }
  if (value >= 1000) {
    const n = (value / 1000).toFixed(0)
    return formatted.replace(/[\d,]+(\.\d+)?/, `${n}K`)
  }
  return formatted
}

function CustomTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; fill: string }>
  label?: string
  currency: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.fill }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-medium text-slate-900">{formatCurrency(p.value, currency)}</span>
        </div>
      ))}
    </div>
  )
}

export default function RevenueChart({ months, currency }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-slate-700">Revenue — last 6 months</p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-500">Paid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-xs text-slate-500">Outstanding</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={months} barGap={2} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => abbreviateCurrency(v, currency)}
            width={56}
          />
          <Tooltip content={<CustomTooltip currency={currency} />} />
          <Bar dataKey="paid" fill="#10b981" radius={[3, 3, 0, 0]} name="Paid" />
          <Bar dataKey="outstanding" fill="#f59e0b" radius={[3, 3, 0, 0]} name="Outstanding" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
