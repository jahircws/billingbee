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
import { useRouter } from "next/navigation"
import { BarChart2 } from "lucide-react"
import { fmtCurrencyShort, getCurrencySymbol } from "@/lib/currency"

interface Props {
  monthlyData: { month: string; revenue: number; outstanding: number }[]
  topClients: { name: string; revenue: number }[]
  totalRevenue: number
  currency: string
  availableCurrencies?: string[]
}

function handleExport(monthlyData: Props["monthlyData"]) {
  const rows = [
    ["Month", "Revenue", "Outstanding"],
    ...monthlyData.map((d) => [d.month, d.revenue.toString(), d.outstanding.toString()]),
  ]
  const csv = rows.map((r) => r.join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "revenue.csv"
  a.click()
  URL.revokeObjectURL(url)
}

export default function RevenueTab({ monthlyData, topClients, totalRevenue, currency, availableCurrencies = [] }: Props) {
  const router = useRouter()
  const fmt = (n: number) => fmtCurrencyShort(n, currency)
  const sym = getCurrencySymbol(currency)

  if (totalRevenue === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <BarChart2 className="w-10 h-10 text-gray-300 mb-3" />
        <p className="text-gray-500 font-medium">No revenue data yet</p>
        <p className="text-sm text-gray-400 mt-1 mb-5">Create your first invoice to start seeing analytics here</p>
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-150"
        >
          Create first invoice with AI
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">12-month revenue</p>
          <p className="text-3xl font-black text-gray-900">{fmt(totalRevenue)}</p>
        </div>
        <div className="flex items-center gap-2">
          {availableCurrencies.length > 1 && (
            <select
              value={currency}
              onChange={(e) => router.push(`/reports?tab=revenue&cur=${e.target.value}`)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              title="Filter by currency"
            >
              {availableCurrencies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => handleExport(monthlyData)}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue by month</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${sym}${(Number(v) / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(v) => [fmt(Number(v)), "Revenue"]}
              contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
            />
            <Bar dataKey="revenue" fill="#059669" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {topClients.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Top clients</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="py-2.5 px-4 text-left text-xs text-gray-400 font-medium">Client</th>
                <th className="py-2.5 px-4 text-right text-xs text-gray-400 font-medium">Revenue</th>
                <th className="py-2.5 px-4 text-right text-xs text-gray-400 font-medium">Share</th>
              </tr>
            </thead>
            <tbody>
              {topClients.map((c) => (
                <tr key={c.name} className="border-b border-gray-50 last:border-0">
                  <td className="py-2.5 px-4 font-medium text-gray-800">{c.name}</td>
                  <td className="py-2.5 px-4 text-right text-gray-700">{fmt(c.revenue)}</td>
                  <td className="py-2.5 px-4 text-right text-gray-500">
                    {totalRevenue > 0 ? `${((c.revenue / totalRevenue) * 100).toFixed(1)}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
