"use client"

import { useEffect, useRef, useState } from "react"

const statusColor: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  UNPAID: "bg-amber-100 text-amber-700",
  PAID: "bg-emerald-100 text-emerald-700",
  OVERDUE: "bg-red-100 text-red-700",
}

interface Props {
  invoiceId: string
  initialStatus: string
}

export default function InvoiceStatusPoller({ invoiceId, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus)
  const [msg, setMsg] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (status !== "UNPAID" && status !== "OVERDUE") return

    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/invoice/${invoiceId}/status`)
        if (!res.ok) return
        const data = await res.json()
        if (data.status && data.status !== status) {
          setStatus(data.status)
          if (data.status === "PAID") {
            setMsg("Payment received!")
            setTimeout(() => setMsg(null), 4000)
            if (intervalRef.current) clearInterval(intervalRef.current)
          }
        }
      } catch {
        // keep polling
      }
    }, 8000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[status] ?? "bg-gray-100 text-gray-600"}`}>
        {status}
      </span>
      {msg && (
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
          {msg}
        </span>
      )}
    </div>
  )
}
