import Link from "next/link"
import { FileText } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

const statusColor: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  UNPAID: "bg-amber-100 text-amber-700",
  PAID: "bg-emerald-100 text-emerald-700",
  OVERDUE: "bg-red-100 text-red-700",
  PARTIALLY_PAID: "bg-blue-100 text-blue-700",
}

const statusLabel: Record<string, string> = {
  DRAFT: "Draft",
  UNPAID: "Unpaid",
  PAID: "Paid",
  OVERDUE: "Overdue",
  PARTIALLY_PAID: "Partial",
}

// Deterministic color from client name initial
const avatarColors = [
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
]

function avatarColor(name: string) {
  return avatarColors[name.charCodeAt(0) % avatarColors.length]
}

interface RecentInvoice {
  id: string
  invoiceNumber: string
  amountDue: number
  currency: string
  status: string
  createdAt: Date
  dueDate: Date | null
  paidAt: Date | null
  client: { name: string }
}

interface Props {
  invoices: RecentInvoice[]
  currency: string
}

export default function RecentInvoices({ invoices, currency }: Props) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
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
            <Link key={inv.id} href={`/invoices/${inv.id}`} className="flex items-center gap-3 py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors duration-150">
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${avatarColor(inv.client.name)}`}>
                {inv.client.name.charAt(0).toUpperCase()}
              </div>

              {/* Client + invoice info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{inv.client.name}</p>
                <p className="text-xs text-slate-400">
                  {inv.invoiceNumber}
                  {inv.dueDate && (
                    <> · due {formatDate(inv.dueDate, inv.currency)}</>
                  )}
                </p>
              </div>

              {/* Status badge */}
              <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor[inv.status] ?? "bg-gray-100 text-gray-600"}`}>
                {statusLabel[inv.status] ?? inv.status}
              </span>

              {/* Amount */}
              <p className="shrink-0 text-sm font-semibold text-slate-900">
                {formatCurrency(inv.amountDue, inv.currency)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
