"use client"

import { useRouter } from "next/navigation"
import { fmtCurrency } from "@/lib/currency"

interface TaxRow {
  rate: number
  taxAmount: number
  name?: string
}

function handleExport(taxData: TaxRow[]) {
  const rows = [
    ["Tax rate", "Tax collected"],
    ...taxData.map((d) => [`${d.rate}%`, d.taxAmount.toFixed(2)]),
  ]
  const csv = rows.map((r) => r.join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "tax_report.csv"
  a.click()
  URL.revokeObjectURL(url)
}

export default function TaxTab({ taxData, currency, availableCurrencies = [] }: { taxData: TaxRow[]; currency: string; availableCurrencies?: string[] }) {
  const router = useRouter()
  const fmt = (n: number) => fmtCurrency(n, currency)
  const total = taxData.reduce((s, d) => s + d.taxAmount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Total tax collected ({currency})</p>
          <p className="text-3xl font-black text-gray-900">{fmt(total)}</p>
        </div>
        <div className="flex items-center gap-2">
          {availableCurrencies.length > 1 && (
            <select
              value={currency}
              onChange={(e) => router.push(`/reports?tab=tax&cur=${e.target.value}`)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {availableCurrencies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
          {taxData.length > 0 && (
            <button
              onClick={() => handleExport(taxData)}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
            >
              Export CSV
            </button>
          )}
        </div>
      </div>

      {taxData.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">No tax data yet.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="py-2.5 px-4 text-left text-xs text-gray-400 font-medium">Tax rate</th>
                <th className="py-2.5 px-4 text-right text-xs text-gray-400 font-medium">Tax collected</th>
                <th className="py-2.5 px-4 text-right text-xs text-gray-400 font-medium">Share</th>
              </tr>
            </thead>
            <tbody>
              {taxData.map((d) => (
                <tr key={d.rate} className="border-b border-gray-50 last:border-0">
                  <td className="py-2.5 px-4 font-medium text-gray-800">{d.name ?? (currency === "INR" ? "GST" : "Tax")} {d.rate}%</td>
                  <td className="py-2.5 px-4 text-right text-gray-700 font-semibold">{fmt(d.taxAmount)}</td>
                  <td className="py-2.5 px-4 text-right text-gray-500">
                    {total > 0 ? `${((d.taxAmount / total) * 100).toFixed(1)}%` : "—"}
                  </td>
                </tr>
              ))}
              <tr className="border-t border-gray-200">
                <td className="py-2.5 px-4 font-bold text-gray-900">Total</td>
                <td className="py-2.5 px-4 text-right font-bold text-emerald-600">{fmt(total)}</td>
                <td className="py-2.5 px-4 text-right font-medium text-gray-500">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
