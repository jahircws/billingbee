import Link from "next/link"
import { DollarSign, TrendingUp, FileSignature, Users } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface StatCardsData {
  outstandingByCurrency: Record<string, number>
  paidThisMonthByCurrency: Record<string, number>
  prevMonthPaidByCurrency: Record<string, number>
  activeProposals: number
  clientCount: number
}

interface Props {
  data: StatCardsData
  currency: string  // org default — shown first
}

function MultiCurrencyValue({
  byCurrency,
  orgCurrency,
  emptyLabel,
}: {
  byCurrency: Record<string, number>
  orgCurrency: string
  emptyLabel?: string
}) {
  const entries = Object.entries(byCurrency).filter(([, v]) => v > 0)
  if (entries.length === 0) return (
    <div>
      <span className="text-2xl font-semibold text-slate-900 tracking-tight">—</span>
      {emptyLabel && <p className="text-xs text-slate-400 mt-0.5">{emptyLabel}</p>}
    </div>
  )

  entries.sort(([a], [b]) => {
    if (a === orgCurrency) return -1
    if (b === orgCurrency) return 1
    return a.localeCompare(b)
  })

  const [primary, ...rest] = entries
  return (
    <div>
      <p className="text-2xl font-semibold text-slate-900 tracking-tight leading-tight">
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

function TrendPill({ thisPaid, prevPaid }: { thisPaid: number; prevPaid: number }) {
  if (prevPaid === 0) return null
  const pct = Math.round(((thisPaid - prevPaid) / prevPaid) * 100)
  const up = pct >= 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
        up ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
      }`}
    >
      {up ? "↑" : "↓"} {Math.abs(pct)}% vs last month
    </span>
  )
}

export default function StatCards({ data, currency }: Props) {
  const thisPaid = data.paidThisMonthByCurrency[currency] ?? 0
  const prevPaid = data.prevMonthPaidByCurrency[currency] ?? 0

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Outstanding */}
      <div className="relative bg-white border border-slate-200 rounded-lg p-5 shadow overflow-hidden">
        <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg bg-amber-400" />
        <div className="flex items-center gap-1.5 mb-2">
          <DollarSign size={13} className="text-amber-500 shrink-0" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Outstanding</p>
        </div>
        <div className="mb-2">
          <MultiCurrencyValue byCurrency={data.outstandingByCurrency} orgCurrency={currency} emptyLabel="No invoices yet" />
        </div>
        <Link href="/invoices?status=UNPAID" className="text-xs text-emerald-600 font-medium hover:underline">
          Send reminder →
        </Link>
      </div>

      {/* Paid this month */}
      <div className="relative bg-white border border-slate-200 rounded-lg p-5 shadow overflow-hidden">
        <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg bg-emerald-500" />
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp size={13} className="text-emerald-500 shrink-0" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Paid this month</p>
        </div>
        <div className="mb-2">
          <MultiCurrencyValue byCurrency={data.paidThisMonthByCurrency} orgCurrency={currency} emptyLabel="No payments yet" />
        </div>
        <TrendPill thisPaid={thisPaid} prevPaid={prevPaid} />
      </div>

      {/* Active proposals */}
      <div className="relative bg-white border border-slate-200 rounded-lg p-5 shadow overflow-hidden">
        <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg bg-violet-400" />
        <div className="flex items-center gap-1.5 mb-2">
          <FileSignature size={13} className="text-violet-500 shrink-0" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Proposals</p>
        </div>
        <div className="mb-2">
          <p className="text-2xl font-semibold text-slate-900 tracking-tight leading-tight">{data.activeProposals}</p>
          {data.activeProposals === 0 && <p className="text-xs text-slate-400 mt-0.5">No proposals yet</p>}
        </div>
        <Link href="/proposals" className="text-xs text-emerald-600 font-medium hover:underline">
          New proposal →
        </Link>
      </div>

      {/* Clients */}
      <div className="relative bg-white border border-slate-200 rounded-lg p-5 shadow overflow-hidden">
        <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg bg-sky-400" />
        <div className="flex items-center gap-1.5 mb-2">
          <Users size={13} className="text-sky-500 shrink-0" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Clients</p>
        </div>
        <div className="mb-2">
          <p className="text-2xl font-semibold text-slate-900 tracking-tight leading-tight">{data.clientCount}</p>
          {data.clientCount === 0 && <p className="text-xs text-slate-400 mt-0.5">No clients yet</p>}
        </div>
        <Link href="/clients" className="text-xs text-emerald-600 font-medium hover:underline">
          Add client →
        </Link>
      </div>
    </div>
  )
}
