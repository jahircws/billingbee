"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { respondToProposal } from "@/app/actions/proposal"

interface Props {
  proposalId: string
  orgSlug: string
}

export default function ProposalActions({ proposalId, orgSlug }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<"accept" | "reject" | null>(null)
  const [error, setError] = useState("")

  async function handle(response: "ACCEPTED" | "REJECTED") {
    setLoading(response === "ACCEPTED" ? "accept" : "reject")
    setError("")
    try {
      const result = await respondToProposal(proposalId, response)
      if ("error" in result) { setError(result.error ?? "Something went wrong"); return }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button
          onClick={() => handle("ACCEPTED")}
          disabled={loading !== null}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 text-sm"
        >
          {loading === "accept" ? "Accepting…" : "✓ Accept proposal"}
        </button>
        <button
          onClick={() => handle("REJECTED")}
          disabled={loading !== null}
          className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 text-sm"
        >
          {loading === "reject" ? "Declining…" : "Decline"}
        </button>
      </div>
    </div>
  )
}
