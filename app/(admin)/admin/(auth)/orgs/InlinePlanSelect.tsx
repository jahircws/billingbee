"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  orgId: string
  currentPlan: string
  planExpiry: string | null
  adminId: string
}

export default function InlinePlanSelect({ orgId, currentPlan, planExpiry, adminId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function setPlan(plan: string) {
    if (plan === currentPlan) return
    setLoading(true)
    await fetch("/api/admin/org-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId, adminId, action: "set_plan", plan }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <div>
      <select
        value={currentPlan}
        disabled={loading}
        onChange={(e) => setPlan(e.target.value)}
        className={`text-xs rounded-full px-2.5 py-0.5 font-medium border-0 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer disabled:opacity-50 ${
          currentPlan === "pro"
            ? "bg-emerald-500/20 text-emerald-400"
            : currentPlan === "business"
            ? "bg-purple-500/20 text-purple-400"
            : "bg-gray-700 text-gray-400"
        }`}
      >
        <option value="free">free</option>
        <option value="pro">pro</option>
        <option value="business">business</option>
      </select>
      {planExpiry && (
        <p className="text-gray-500 text-xs mt-0.5">
          exp {new Date(planExpiry).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}
