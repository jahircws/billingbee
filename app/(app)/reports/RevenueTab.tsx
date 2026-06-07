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
import Link from "next/link"

interface Props {
  monthlyData: { month: string; revenue: number }[]
  topClients: { name: string; revenue: number }[]
  totalRevenue: number
}

const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

function handleExport(monthlyData: Props["monthlyData"]) {
  const rows = [
    ["Month", "Revenue"],
    ...monthlyData.map((d) => [d.month, d.revenue.toString()]),
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

export default function RevenueTab({ monthlyData, topClients, totalRevenue }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">12-month revenue</p>
          <p className="text-3xl font-black text-gray-900">{fmt(totalRevenue)}</p>
        </div>
        <button
          onClick={() => handleExport(monthlyData)}
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
        >
          Export CSV
        </button>
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
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
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
