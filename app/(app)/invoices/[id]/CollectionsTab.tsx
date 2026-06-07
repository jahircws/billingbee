"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
import { Send, PauseCircle, XCircle, Clock, CheckCircle, SkipForward, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { cancelCollections, pauseCollections, sendCollectionNow } from "@/app/actions/collections"

interface CollectionEventRow {
  id: string
  dayNumber: number
  tone: string
  status: string
  scheduledAt: string
  sentAt: string | null
  subject: string | null
  textBody: string | null
  autoFollowUp: boolean
}

const TONE_LABEL: Record<string, string> = {
  FRIENDLY: "Friendly check-in",
  REMINDER: "Friendly reminder",
  FIRM: "Firm notice",
  ESCALATE: "Escalation",
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING: <Clock size={14} className="text-amber-500" />,
  SENT: <CheckCircle size={14} className="text-emerald-600" />,
  SKIPPED: <SkipForward size={14} className="text-gray-400" />,
  CANCELLED: <XCircle size={14} className="text-gray-400" />,
  FAILED: <AlertCircle size={14} className="text-red-500" />,
}

export default function CollectionsTab({
  invoiceId,
  orgId,
  events,
}: {
  invoiceId: string
  orgId: string
  events: CollectionEventRow[]
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<string | null>(null)

  function act(fn: () => Promise<void>, msg: string) {
    startTransition(async () => {
      try {
        await fn()
        setFeedback(msg)
        setTimeout(() => setFeedback(null), 3000)
      } catch (err) {
        setFeedback(err instanceof Error ? err.message : "Action failed")
      }
    })
  }

  const pendingCount = events.filter((e) => e.status === "PENDING").length

  return (
    <div className="space-y-4">
      {/* Summary + bulk actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-gray-600">
          {pendingCount > 0
            ? `${pendingCount} follow-up${pendingCount !== 1 ? "s" : ""} scheduled`
            : "No pending follow-ups"}
        </p>

        {pendingCount > 0 && (
          <div className="flex gap-2">
            <button
              disabled={isPending}
              onClick={() => act(() => pauseCollections(orgId, invoiceId, 7), "Follow-ups paused for 7 days")}
              className="flex items-center gap-1.5 text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <PauseCircle size={13} />
              Pause 7 days
            </button>
            <button
              disabled={isPending}
              onClick={() => act(() => cancelCollections(orgId, invoiceId), "All follow-ups cancelled")}
              className="flex items-center gap-1.5 text-xs border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <XCircle size={13} />
              Stop all
            </button>
          </div>
        )}
      </div>

      {feedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-3 py-2 rounded-lg">
          {feedback}
        </div>
      )}

      {/* Event timeline */}
      <div className="space-y-2">
        {events.map((event) => {
          const isExpanded = expandedId === event.id
          const scheduledDate = new Date(event.sentAt ?? event.scheduledAt)

          return (
            <div key={event.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Status icon */}
                <div className="shrink-0">{STATUS_ICON[event.status] ?? <Clock size={14} />}</div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">
                      Day {event.dayNumber} — {TONE_LABEL[event.tone] ?? event.tone}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      event.status === "PENDING" ? "bg-amber-50 text-amber-600" :
                      event.status === "SENT" ? "bg-emerald-50 text-emerald-600" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {event.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {event.status === "SENT" ? `Sent ${format(scheduledDate, "d MMM yyyy")}` : `Scheduled ${format(new Date(event.scheduledAt), "d MMM yyyy")}`}
                  </p>
                  {event.subject && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">"{event.subject}"</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {event.status === "PENDING" && (
                    <button
                      disabled={isPending}
                      onClick={() => act(() => sendCollectionNow(orgId, event.id), "Reminder sent")}
                      className="flex items-center gap-1 text-xs text-emerald-700 hover:bg-emerald-50 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Send size={11} />
                      Send now
                    </button>
                  )}
                  {event.textBody && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : event.id)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded email preview */}
              {isExpanded && event.textBody && (
                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                  <p className="text-xs font-medium text-gray-500 mb-1">Email preview</p>
                  <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{event.textBody}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {events.length === 0 && (
        <div className="text-center py-10 text-sm text-gray-400">
          No follow-up emails scheduled for this invoice.
        </div>
      )}
    </div>
  )
}
