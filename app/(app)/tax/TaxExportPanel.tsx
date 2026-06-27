"use client"

import { useState } from "react"
import { Download } from "lucide-react"

interface Props {
  isPro: boolean
  isINR: boolean
}

export default function TaxExportPanel({ isPro, isINR }: Props) {
  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()
  const qStartMonth = Math.floor(month / 3) * 3
  const defaultFrom = `${year}-${String(qStartMonth + 1).padStart(2, "0")}-01`
  const qEndDate = new Date(year, qStartMonth + 3, 0)
  const defaultTo = qEndDate.toISOString().slice(0, 10)

  const [type, setType] = useState<"gstr" | "pl">(isINR && isPro ? "gstr" : "pl")
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)

  const href = `/api/tax/export-csv?type=${type}&from=${from}&to=${to}`

  return (
    <div className="flex flex-wrap items-end gap-3">
      {isINR && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Export type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "gstr" | "pl")}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {isPro && <option value="gstr">GSTR Summary</option>}
            <option value="pl">P&amp;L Summary</option>
          </select>
        </div>
      )}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">From</label>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">To</label>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
      <a
        href={href}
        className="inline-flex items-center gap-2 text-sm font-semibold border border-gray-300 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
      >
        <Download className="h-4 w-4" />
        Download CSV
      </a>
    </div>
  )
}
