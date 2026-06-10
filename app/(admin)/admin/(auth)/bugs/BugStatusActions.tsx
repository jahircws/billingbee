"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

const NEXT_STATUS: Record<string, { label: string; next: string }> = {
  OPEN: { label: "Start", next: "IN_PROGRESS" },
  IN_PROGRESS: { label: "Resolve", next: "RESOLVED" },
  RESOLVED: { label: "Reopen", next: "OPEN" },
}

export default function BugStatusActions({ id, status }: { id: string; status: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const action = NEXT_STATUS[status]

  async function updateStatus() {
    setLoading(true)
    await fetch("/api/admin/bug-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: action.next }),
    })
    setLoading(false)
    router.refresh()
  }

  if (!action) return null

  return (
    <button
      onClick={updateStatus}
      disabled={loading}
      className="text-xs font-medium text-emerald-700 hover:text-emerald-900 disabled:opacity-50 whitespace-nowrap"
    >
      {loading ? "…" : action.label}
    </button>
  )
}
