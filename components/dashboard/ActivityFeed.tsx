import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import type { ActivityEvent } from "@/app/(app)/dashboard/data"

interface Props {
  events: ActivityEvent[]
}

const dotClass: Record<ActivityEvent["type"], string> = {
  invoice_sent: "bg-emerald-400",
  payment_received: "bg-emerald-400",
  contract_signed: "bg-emerald-400",
  proposal_accepted: "bg-emerald-400",
}

export default function ActivityFeed({ events }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex-1">
      <p className="text-xs font-semibold text-slate-700 mb-3">Recent activity</p>

      {events.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-4">No activity yet</p>
      ) : (
        <div className="space-y-1">
          {events.map((event, i) => (
            <Link
              key={i}
              href={event.href}
              className="flex items-start gap-2.5 hover:bg-slate-50 rounded-lg p-1.5 -mx-1.5 transition-all duration-150"
            >
              <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${dotClass[event.type]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-700 leading-tight">{event.description}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {formatDistanceToNow(event.timestamp)} ago
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
