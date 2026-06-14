import Link from "next/link"
import { Tag } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface Props {
  thisMonth: number
  lastMonth: number
  topCategory?: string | null
  currency: string
}

export default function ExpenseSnapshot({ thisMonth, lastMonth, topCategory, currency }: Props) {
  const max = Math.max(thisMonth, lastMonth)
  const thisMonthWidth = max > 0 ? Math.round((thisMonth / max) * 100) : 0
  const lastMonthWidth = max > 0 ? Math.round((lastMonth / max) * 100) : 0

  const pct = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0
  const deltaUp = thisMonth > lastMonth
  const deltaDown = thisMonth < lastMonth
  const deltaEqual = thisMonth === lastMonth || lastMonth === 0

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-slate-700">Expenses this month</p>
        <Link href="/expenses" className="text-xs text-emerald-600 hover:text-emerald-700 transition-colors duration-150">
          View →
        </Link>
      </div>

      {thisMonth === 0 && lastMonth === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">No expenses recorded this month</p>
      ) : (
        <>
          <p className="text-2xl font-bold text-slate-900 mb-1">
            {formatCurrency(thisMonth, currency)}
          </p>

          <p className={`text-sm mb-4 ${deltaUp ? "text-red-500" : deltaDown ? "text-emerald-500" : "text-slate-500"}`}>
            {deltaEqual
              ? "Same as last month"
              : deltaUp
              ? `↑ ${pct}% vs last month`
              : `↓ ${Math.abs(pct)}% vs last month`}
          </p>

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>This month</span>
              <span>Last month</span>
            </div>
            <div className="space-y-1.5">
              <div className="bg-slate-100 rounded-full h-1.5">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${thisMonthWidth}%` }}
                />
              </div>
              <div className="bg-slate-100 rounded-full h-1.5">
                <div
                  className="bg-amber-400 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${lastMonthWidth}%` }}
                />
              </div>
            </div>
          </div>

          {topCategory && (
            <div className="flex items-center gap-1.5 mt-4">
              <Tag size={12} className="text-slate-400" />
              <span className="text-xs text-slate-500">Top category: {topCategory}</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
