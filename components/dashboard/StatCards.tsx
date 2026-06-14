import { DollarSign, TrendingUp, FileSignature, Users } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface StatCardsData {
  outstanding: number
  paidThisMonth: number
  activeProposals: number
  clientCount: number
}

interface Props {
  data: StatCardsData
  currency: string
}

function StatCard({
  label,
  value,
  sub,
  borderColor,
  iconBg,
  iconColor,
  icon: Icon,
}: {
  label: string
  value: string
  sub: string
  borderColor: string
  iconBg: string
  iconColor: string
  icon: React.ElementType
}) {
  return (
    <div className={`bg-white rounded-xl border-l-4 ${borderColor} border border-slate-200 shadow-sm p-5 flex items-start gap-3`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon size={18} className={iconColor} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-900 leading-tight">{value}</p>
        <p className="text-xs text-slate-400 mt-1">{sub}</p>
      </div>
    </div>
  )
}

export default function StatCards({ data, currency }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        label="Total outstanding"
        value={formatCurrency(data.outstanding, currency)}
        sub="unpaid + overdue"
        borderColor="border-l-amber-400"
        iconBg="bg-amber-50"
        iconColor="text-amber-600"
        icon={DollarSign}
      />
      <StatCard
        label="Paid this month"
        value={formatCurrency(data.paidThisMonth, currency)}
        sub="received this month"
        borderColor="border-l-emerald-400"
        iconBg="bg-emerald-50"
        iconColor="text-emerald-600"
        icon={TrendingUp}
      />
      <StatCard
        label="Active proposals"
        value={data.activeProposals.toString()}
        sub="awaiting response"
        borderColor="border-l-violet-400"
        iconBg="bg-violet-50"
        iconColor="text-violet-600"
        icon={FileSignature}
      />
      <StatCard
        label="Total clients"
        value={data.clientCount.toString()}
        sub="all time"
        borderColor="border-l-sky-400"
        iconBg="bg-sky-50"
        iconColor="text-sky-600"
        icon={Users}
      />
    </div>
  )
}
