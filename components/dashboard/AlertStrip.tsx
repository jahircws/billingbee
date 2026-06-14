import Link from "next/link"
import { AlertCircle, Clock, FileText, PenLine } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface AlertStripData {
  overdueCount: number
  overdueAmount: number
  dueSoonCount: number
  dueSoonAmount: number
  draftCount: number
  unsignedContractCount: number
}

interface Props {
  data: AlertStripData
  currency: string
}

export default function AlertStrip({ data, currency }: Props) {
  const hasOverdue = data.overdueCount > 0
  const hasDueSoon = data.dueSoonCount > 0
  const hasDrafts = data.draftCount > 0
  const hasUnsigned = data.unsignedContractCount > 0

  if (!hasOverdue && !hasDueSoon && !hasDrafts && !hasUnsigned) return null

  return (
    <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
      {hasOverdue && (
        <Link href="/invoices?status=OVERDUE" className="flex-1 min-w-[200px]">
          <div className="bg-white rounded-lg border-l-4 border-l-red-400 border border-slate-200 px-4 py-3 shadow-sm hover:shadow-md transition-all duration-150">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <AlertCircle size={12} className="text-red-500" />
              Overdue
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {formatCurrency(data.overdueAmount, currency)}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {data.overdueCount} invoice{data.overdueCount !== 1 ? "s" : ""}
            </div>
          </div>
        </Link>
      )}

      {hasDueSoon && (
        <Link href="/invoices?status=UNPAID" className="flex-1 min-w-[200px]">
          <div className="bg-white rounded-lg border-l-4 border-l-amber-400 border border-slate-200 px-4 py-3 shadow-sm hover:shadow-md transition-all duration-150">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Clock size={12} className="text-amber-500" />
              Due soon
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {formatCurrency(data.dueSoonAmount, currency)}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {data.dueSoonCount} due this week
            </div>
          </div>
        </Link>
      )}

      {hasDrafts && (
        <Link href="/invoices?status=DRAFT" className="flex-1 min-w-[200px]">
          <div className="bg-white rounded-lg border-l-4 border-l-blue-400 border border-slate-200 px-4 py-3 shadow-sm hover:shadow-md transition-all duration-150">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <FileText size={12} className="text-blue-500" />
              Unsent drafts
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {data.draftCount} draft{data.draftCount !== 1 ? "s" : ""}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">ready to send</div>
          </div>
        </Link>
      )}

      {hasUnsigned && (
        <Link href="/contracts?status=SENT" className="flex-1 min-w-[200px]">
          <div className="bg-white rounded-lg border-l-4 border-l-slate-400 border border-slate-200 px-4 py-3 shadow-sm hover:shadow-md transition-all duration-150">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <PenLine size={12} className="text-slate-500" />
              Unsigned contracts
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {data.unsignedContractCount} contract{data.unsignedContractCount !== 1 ? "s" : ""}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">awaiting signature</div>
          </div>
        </Link>
      )}
    </div>
  )
}
