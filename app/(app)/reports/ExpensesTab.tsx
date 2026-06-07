"use client"

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"

import { fmtCurrencyShort, getCurrencySymbol } from "@/lib/currency"

interface Props {
  byCategory: { name: string; color: string | null; amount: number }[]
  monthlyData: { month: string; amount: number }[]
  totalExpenses: number
  currency: string
}

const COLORS = ["#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5"]

export default function ExpensesTab({ byCategory, monthlyData, totalExpenses, currency }: Props) {
  const fmt = (n: number) => fmtCurrencyShort(n, currency)
  const sym = getCurrencySymbol(currency)
  const pieData = byCategory.map((c, i) => ({
    name: c.name,
    value: c.amount,
    color: c.color ?? COLORS[i % COLORS.length],
  }))

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Total expenses (12 months)</p>
        <p className="text-3xl font-black text-gray-900">{fmt(totalExpenses)}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Pie */}
        {pieData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">By category</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {pieData.map((entry, i) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [fmt(Number(v)), ""]} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-1">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-gray-600">{d.name}</span>
                  </div>
                  <span className="font-medium text-gray-800">{fmt(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monthly bar */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">By month</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${sym}${(Number(v) / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [fmt(Number(v)), "Expenses"]} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
              <Bar dataKey="amount" fill="#6ee7b7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
