import Link from "next/link"
import { FileText, CheckCircle, PenLine, ThumbsUp, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { ActivityEvent } from "@/app/(app)/dashboard/data"

interface Props {
  events: ActivityEvent[]
}

const iconConfig = {
  invoice_sent: {
    bg: "bg-blue-50",
    icon: FileText,
    iconClass: "text-blue-500",
  },
  payment_received: {
    bg: "bg-emerald-50",
    icon: CheckCircle,
    iconClass: "text-emerald-500",
  },
  contract_signed: {
    bg: "bg-slate-100",
    icon: PenLine,
    iconClass: "text-slate-600",
  },
  proposal_accepted: {
    bg: "bg-violet-50",
    icon: ThumbsUp,
    iconClass: "text-violet-500",
  },
} as const

export default function ActivityFeed({ events }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <p className="text-sm font-semibold text-slate-700 mb-4">Recent activity</p>

      {events.length === 0 ? (
        <div className="flex flex-col items-center py-4 gap-2">
          <Clock size={32} className="text-slate-300" />
          <p className="text-sm text-slate-500">No recent activity yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {events.map((event, i) => {
            const cfg = iconConfig[event.type]
            const Icon = cfg.icon
            return (
              <Link
                key={i}
                href={event.href}
                className="flex items-start gap-3 hover:bg-slate-50 rounded-lg p-2 -mx-2 transition-all duration-150"
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${cfg.bg}`}>
                  <Icon size={13} className={cfg.iconClass} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-700 leading-tight">{event.description}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {formatDistanceToNow(event.timestamp)} ago
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
