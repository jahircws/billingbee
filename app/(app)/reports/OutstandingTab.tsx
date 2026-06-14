"use client"

import Link from "next/link"
import { format, differenceInDays } from "date-fns"
import { fmtCurrency } from "@/lib/currency"

interface Invoice {
  id: string
  invoiceNumber: string
  clientName: string
  amountDue: number
  currency: string
  status: string
  dueDate: string | null
}

interface Props {
  invoices: Invoice[]
  totalsByCurrency: Record<string, number>
}

const statusColor: Record<string, string> = {
  UNPAID: "bg-amber-100 text-amber-700",
  OVERDUE: "bg-red-100 text-red-700",
}

const statusLabel: Record<string, string> = {
  UNPAID: "Unpaid",
  OVERDUE: "Overdue",
}

export default function OutstandingTab({ invoices, totalsByCurrency }: Props) {
  const now = new Date()
  const currencies = Object.keys(totalsByCurrency).sort()

  return (
    <div className="space-y-6">
      {/* Totals — one per currency */}
      <div className="flex flex-wrap gap-6">
        {currencies.length === 0 ? (
          <p className="text-sm text-gray-500">No outstanding invoices. Great work!</p>
        ) : (
          currencies.map((cur) => (
            <div key={cur}>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">
                Outstanding ({cur})
              </p>
              <p className="text-3xl font-black text-red-600">
                {fmtCurrency(totalsByCurrency[cur], cur)}
              </p>
            </div>
          ))
        )}
      </div>

      {invoices.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="py-2.5 px-4 text-left text-xs text-gray-400 font-medium">#</th>
                  <th className="py-2.5 px-4 text-left text-xs text-gray-400 font-medium">Client</th>
                  <th className="py-2.5 px-4 text-right text-xs text-gray-400 font-medium">Amount due</th>
                  <th className="py-2.5 px-4 text-center text-xs text-gray-400 font-medium">Status</th>
                  <th className="py-2.5 px-4 text-right text-xs text-gray-400 font-medium hidden md:table-cell">Overdue by</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const overdueDays =
                    inv.dueDate && inv.status === "OVERDUE"
                      ? differenceInDays(now, new Date(inv.dueDate))
                      : null
                  return (
                    <tr key={inv.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 px-4">
                        <Link href={`/invoices/${inv.id}`} className="font-mono text-xs text-emerald-700 hover:underline font-medium">
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-2.5 px-4 font-medium text-gray-800">{inv.clientName}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-gray-900">
                        {fmtCurrency(inv.amountDue, inv.currency)}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[inv.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {statusLabel[inv.status] ?? inv.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right text-red-500 font-medium hidden md:table-cell">
                        {overdueDays !== null ? `${overdueDays}d` : inv.dueDate ? format(new Date(inv.dueDate), "d MMM") : "—"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
