import Link from "next/link"
import { FileText } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

// Reuse the same status color map used across the invoices pages
const statusColor: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  UNPAID: "bg-amber-100 text-amber-700",
  PAID: "bg-emerald-100 text-emerald-700",
  OVERDUE: "bg-red-100 text-red-700",
}

// Derive display label from schema enum values — never hardcode display strings separately
const statusLabel: Record<string, string> = {
  DRAFT: "Draft",
  UNPAID: "Unpaid",
  PAID: "Paid",
  OVERDUE: "Overdue",
}

interface RecentInvoice {
  id: string
  invoiceNumber: string
  amountDue: number
  status: string
  createdAt: Date
  paidAt: Date | null
  client: { name: string }
}

interface Props {
  invoices: RecentInvoice[]
  currency: string
}

export default function RecentInvoices({ invoices, currency }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-slate-700">Recent invoices</p>
        <Link href="/invoices" className="text-xs text-emerald-600 hover:text-emerald-700 transition-colors duration-150">
          View all →
        </Link>
      </div>

      {invoices.length === 0 ? (
        <div className="flex flex-col items-center py-8 gap-3">
          <FileText className="w-12 h-12 text-slate-300" />
          <p className="text-sm text-slate-500">No invoices yet</p>
          <Link
            href="/invoices/new"
            className="text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-all duration-150 active:scale-95"
          >
            Create your first invoice
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {invoices.map((inv) => (
            <div key={inv.id} className="flex items-center gap-3 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{inv.client.name}</p>
                <p className="text-xs text-slate-500">{inv.invoiceNumber}</p>
              </div>
              <span
                className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor[inv.status] ?? "bg-gray-100 text-gray-600"}`}
              >
                {statusLabel[inv.status] ?? inv.status}
              </span>
              <p className="shrink-0 text-sm font-medium text-slate-800">
                {formatCurrency(inv.amountDue, currency)}
              </p>
              <div className="shrink-0 w-20 text-right">
                {inv.status === "DRAFT" && (
                  <Link href={`/invoices/${inv.id}`} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors duration-150">
                    Send
                  </Link>
                )}
                {inv.status === "UNPAID" && (
                  <Link href={`/invoices/${inv.id}`} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors duration-150">
                    Mark paid
                  </Link>
                )}
                {inv.status === "OVERDUE" && (
                  <Link href={`/invoices/${inv.id}`} className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors duration-150">
                    Follow up
                  </Link>
                )}
                {inv.status === "PAID" && inv.paidAt && (
                  <span className="text-xs text-slate-400">{formatDate(inv.paidAt)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
