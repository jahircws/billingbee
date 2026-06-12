"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, AlertCircle, CheckCircle, FileCheck, FileX } from "lucide-react"

interface Notification {
  id: string
  type: string
  title: string
  detail: string
  href: string
  at: string
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function iconFor(type: string) {
  switch (type) {
    case "overdue": return <AlertCircle size={14} className="text-red-500" />
    case "payment": return <CheckCircle size={14} className="text-emerald-500" />
    case "quote_accepted": return <FileCheck size={14} className="text-emerald-500" />
    case "quote_rejected": return <FileX size={14} className="text-red-500" />
    default: return <Bell size={14} className="text-gray-400" />
  }
}

export function NotificationBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[] | null>(null)
  const [count, setCount] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Load the count once on mount for the badge
  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => { setItems(d.notifications ?? []); setCount((d.notifications ?? []).length) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        title="Notifications"
      >
        <Bell size={16} />
        {count !== null && count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800">Notifications</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items === null ? (
              <p className="px-4 py-6 text-center text-sm text-gray-400">Loading…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-400">You&apos;re all caught up 🎉</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => { setOpen(false); router.push(n.href) }}
                  className="w-full flex items-start gap-2.5 px-4 py-2.5 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0"
                >
                  <span className="mt-0.5 shrink-0">{iconFor(n.type)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-gray-800 leading-tight">{n.title}</span>
                    <span className="block text-xs text-gray-400 truncate">{n.detail}</span>
                  </span>
                  <span className="text-[10px] text-gray-300 shrink-0">{timeAgo(n.at)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
