import Link from "next/link"
import { DollarSign, TrendingUp, FileSignature, Users } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface StatCardsData {
  outstandingByCurrency: Record<string, number>
  paidThisMonthByCurrency: Record<string, number>
  activeProposals: number
  clientCount: number
}

interface Props {
  data: StatCardsData
  currency: string  // org default — shown first
}

// Render stacked currency amounts: primary large, others as smaller chips
function MultiCurrencyValue({
  byCurrency,
  orgCurrency,
}: {
  byCurrency: Record<string, number>
  orgCurrency: string
}) {
  const entries = Object.entries(byCurrency).filter(([, v]) => v > 0)
  if (entries.length === 0) return <span className="text-2xl font-bold text-slate-900">—</span>

  entries.sort(([a], [b]) => {
    if (a === orgCurrency) return -1
    if (b === orgCurrency) return 1
    return a.localeCompare(b)
  })

  const [primary, ...rest] = entries
  return (
    <div>
      <p className="text-2xl font-bold text-slate-900 leading-tight">
        {formatCurrency(primary[1], primary[0])}
      </p>
      {rest.map(([cur, amt]) => (
        <p key={cur} className="text-xs text-slate-500 mt-0.5">
          {formatCurrency(amt, cur)}
        </p>
      ))}
    </div>
  )
}

export default function StatCards({ data, currency }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      <div className="bg-white rounded-xl border-l-4 border-l-amber-400 border border-slate-200 shadow-sm p-5 flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-amber-50">
          <DollarSign size={18} className="text-amber-600" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500 mb-1">Total outstanding</p>
          <MultiCurrencyValue byCurrency={data.outstandingByCurrency} orgCurrency={currency} />
          <Link href="/invoices?status=UNPAID" className="text-xs text-emerald-600 font-medium mt-1 hover:underline block">
            Send reminder →
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border-l-4 border-l-emerald-400 border border-slate-200 shadow-sm p-5 flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50">
          <TrendingUp size={18} className="text-emerald-600" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500 mb-1">Paid this month</p>
          <MultiCurrencyValue byCurrency={data.paidThisMonthByCurrency} orgCurrency={currency} />
          <Link href="/invoices/new" className="text-xs text-emerald-600 font-medium mt-1 hover:underline block">
            New invoice →
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border-l-4 border-l-violet-400 border border-slate-200 shadow-sm p-5 flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-violet-50">
          <FileSignature size={18} className="text-violet-600" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500 mb-1">Active proposals</p>
          <p className="text-2xl font-bold text-slate-900 leading-tight">{data.activeProposals}</p>
          <Link href="/proposals" className="text-xs text-emerald-600 font-medium mt-1 hover:underline block">
            New proposal →
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border-l-4 border-l-sky-400 border border-slate-200 shadow-sm p-5 flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-sky-50">
          <Users size={18} className="text-sky-600" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500 mb-1">Total clients</p>
          <p className="text-2xl font-bold text-slate-900 leading-tight">{data.clientCount}</p>
          <Link href="/clients" className="text-xs text-emerald-600 font-medium mt-1 hover:underline block">
            Add client →
          </Link>
        </div>
      </div>
    </div>
  )
}
