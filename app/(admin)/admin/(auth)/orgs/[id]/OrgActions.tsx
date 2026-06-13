"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  org: { id: string; plan: string; planExpiry: string | null }
  adminId: string
}

export default function OrgActions({ org, adminId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState("")

  async function call(action: string, body?: object) {
    setLoading(action)
    setError("")
    const res = await fetch("/api/admin/org-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId: org.id, adminId, action, ...body }),
    })
    const data = await res.json()
    setLoading(null)
    if (!res.ok) { setError(data.error ?? "Action failed"); return }
    if (data.redirectTo) {
      window.location.href = data.redirectTo
      return
    }
    router.refresh()
  }

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <button
        onClick={() => call("impersonate")}
        disabled={!!loading}
        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg px-4 py-2 disabled:opacity-50"
      >
        {loading === "impersonate" ? "…" : "Impersonate"}
      </button>

      <button
        onClick={() => call("extend_trial")}
        disabled={!!loading}
        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg px-4 py-2 disabled:opacity-50"
      >
        {loading === "extend_trial" ? "…" : "Extend trial +30 days"}
      </button>

      <select
        onChange={(e) => { if (e.target.value) call("set_plan", { plan: e.target.value }) }}
        disabled={!!loading}
        defaultValue=""
        className="bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded-lg px-3 py-2 disabled:opacity-50"
      >
        <option value="" disabled>Set plan…</option>
        <option value="free">Free</option>
        <option value="pro">Pro</option>
        <option value="business">Business</option>
      </select>

      {error && <p className="w-full text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}
