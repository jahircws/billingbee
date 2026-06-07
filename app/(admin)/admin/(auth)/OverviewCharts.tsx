"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

interface Props {
  data: { date: string; count: number }[]
}

export default function OverviewCharts({ data }: Props) {
  return (
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
  )
}
