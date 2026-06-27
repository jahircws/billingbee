import Link from "next/link"
import { Plus, FileText, PenLine, UserPlus } from "lucide-react"

export default function QuickActions() {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Link
        href="/invoices/new"
        className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors duration-150"
      >
        <Plus size={15} strokeWidth={2.5} />
        New Invoice
      </Link>
      <Link
        href="/proposals/new"
        className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg px-3 py-2 text-sm flex items-center gap-2 transition-colors duration-150"
      >
        <FileText size={14} />
        New Proposal
      </Link>
      <Link
        href="/contracts/new"
        className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg px-3 py-2 text-sm flex items-center gap-2 transition-colors duration-150"
      >
        <PenLine size={14} />
        New Contract
      </Link>
      <Link
        href="/clients"
        className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg px-3 py-2 text-sm flex items-center gap-2 transition-colors duration-150"
      >
        <UserPlus size={14} />
        Add Client
      </Link>
    </div>
  )
}
