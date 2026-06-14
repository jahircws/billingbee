import Link from "next/link"
import { formatCurrency } from "@/lib/utils"

interface TopClient {
  name: string
  amount: number
  pct: number
}

interface Props {
  clients: TopClient[]
  currency: string
}

export default function TopClients({ clients, currency }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-slate-700">Top clients this month</p>
        <Link href="/reports" className="text-xs text-emerald-600 hover:text-emerald-700 transition-colors duration-150">
          View reports →
        </Link>
      </div>

      {clients.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">No payments received this month yet</p>
      ) : (
        <div className="space-y-0">
          {clients.map((client, i) => (
            <div key={client.name} className="flex items-center gap-3 py-2">
              <span className="text-xs text-slate-400 w-4 shrink-0">{i + 1}</span>
              <p className="text-sm text-slate-700 flex-1 truncate">{client.name}</p>
              <div className="flex-1 mx-2 max-w-[80px]">
                <div className="bg-slate-100 rounded-full h-1.5">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.round(client.pct)}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-slate-500 min-w-[64px] text-right">
                {formatCurrency(client.amount, currency)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
