"use client"

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

export default function AIUsageCharts({ data }: { data: { date: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} tickLine={false} interval={4} />
        <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#d1d5db" }}
          itemStyle={{ color: "#34d399" }}
        />
        <Line type="monotone" dataKey="count" stroke="#059669" strokeWidth={2} dot={false} name="API Calls" />
      </LineChart>
    </ResponsiveContainer>
  )
}
