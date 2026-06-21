"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts"

interface Props {
  data: { date: string; count: number }[]
  mauData: { month: string; users: number }[]
}

export default function OverviewCharts({ data, mauData }: Props) {
  return (
    <div className="space-y-8">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">New Signups — Last 30 Days</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              tickLine={false}
              interval={4}
            />
            <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "#d1d5db" }}
              itemStyle={{ color: "#34d399" }}
            />
            <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} name="Signups" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-1">Monthly Active Users — Last 6 Months</h2>
        <p className="text-xs text-gray-500 mb-4">Users in orgs that created at least one invoice that month</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={mauData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 11 }} tickLine={false} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "#d1d5db" }}
              itemStyle={{ color: "#818cf8" }}
            />
            <Line
              type="monotone"
              dataKey="users"
              stroke="#818cf8"
              strokeWidth={2}
              dot={{ fill: "#818cf8", r: 4 }}
              name="Active Users"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
