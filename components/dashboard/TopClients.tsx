import Link from "next/link"
import { formatCurrency } from "@/lib/utils"

interface TopClient {
  name: string
  amount: number
  currency: string
}

interface Props {
  clients: TopClient[]
}

export default function TopClients({ clients }: Props) {
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
            <div key={`${client.name}-${client.currency}`} className="flex items-center gap-3 py-2">
              <span className="text-xs text-slate-400 w-4 shrink-0">{i + 1}</span>
              <p className="text-sm text-slate-700 flex-1 truncate">{client.name}</p>
              <span className="text-xs font-medium text-slate-500 shrink-0">
                {formatCurrency(client.amount, client.currency)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
