import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { differenceInDays } from "date-fns"

interface PendingProposal {
  id: string
  title: string
  sentAt: Date | null
  client: { name: string }
}

interface PendingContract {
  id: string
  title: string
  sentAt: Date | null
  client: { name: string }
}

interface Props {
  proposals: PendingProposal[]
  contracts: PendingContract[]
}

function daysSince(date: Date | null): string {
  if (!date) return "recently"
  const days = differenceInDays(new Date(), date)
  if (days === 0) return "today"
  if (days === 1) return "1 day ago"
  return `${days} days ago`
}

export default function PendingItems({ proposals, contracts }: Props) {
  const hasProposals = proposals.length > 0
  const hasContracts = contracts.length > 0

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <p className="text-sm font-semibold text-slate-700 mb-3">Pending</p>

      {!hasProposals && !hasContracts ? (
        <div className="flex flex-col items-center py-4 gap-2 text-center">
          <CheckCircle size={20} className="text-emerald-500" />
          <p className="text-sm text-slate-500">No pending items</p>
        </div>
      ) : (
        <div className="space-y-1">
          {hasProposals && (
            <>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">
                Proposals awaiting response
              </p>
              {proposals.slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-start gap-2 py-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{p.client.name}</p>
                    <p className="text-xs text-slate-500 truncate">{p.title}</p>
                    <p className="text-xs text-slate-400">sent {daysSince(p.sentAt)}</p>
                  </div>
                  <Link
                    href={`/proposals/${p.id}`}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium shrink-0 transition-colors duration-150"
                  >
                    View →
                  </Link>
                </div>
              ))}
              {proposals.length > 3 && (
                <Link
                  href="/proposals?status=SENT"
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors duration-150"
                >
                  + {proposals.length - 3} more
                </Link>
              )}
            </>
          )}

          {hasProposals && hasContracts && (
            <div className="border-t border-slate-100 my-3" />
          )}

          {hasContracts && (
            <>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">
                Contracts awaiting signature
              </p>
              {contracts.slice(0, 3).map((c) => (
                <div key={c.id} className="flex items-start gap-2 py-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{c.client.name}</p>
                    <p className="text-xs text-slate-500 truncate">{c.title}</p>
                    <p className="text-xs text-slate-400">sent {daysSince(c.sentAt)}</p>
                  </div>
                  <Link
                    href={`/contracts/${c.id}`}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium shrink-0 transition-colors duration-150"
                  >
                    View →
                  </Link>
                </div>
              ))}
              {contracts.length > 3 && (
                <Link
                  href="/contracts?status=SENT"
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors duration-150"
                >
                  + {contracts.length - 3} more
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
