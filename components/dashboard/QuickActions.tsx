import Link from "next/link"
import { Plus, FileSignature, FileCheck, UserPlus } from "lucide-react"

export default function QuickActions() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <p className="text-sm font-semibold text-slate-700 mb-3">Quick actions</p>
      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/invoices/new"
          className="flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-all duration-150 active:scale-95"
        >
          <Plus size={15} />
          New Invoice
        </Link>
        <Link
          href="/proposals"
          className="flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium bg-violet-500 hover:bg-violet-600 text-white transition-all duration-150 active:scale-95"
        >
          <FileSignature size={15} />
          New Proposal
        </Link>
        <Link
          href="/contracts/new"
          className="flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium bg-slate-700 hover:bg-slate-800 text-white transition-all duration-150 active:scale-95"
        >
          <FileCheck size={15} />
          New Contract
        </Link>
        <Link
          href="/clients"
          className="flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all duration-150 active:scale-95"
        >
          <UserPlus size={15} />
          New Client
        </Link>
      </div>
    </div>
  )
}
