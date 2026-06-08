"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Send } from "lucide-react"
import { sendProposalToClient } from "@/app/actions/proposal"

interface Props {
  proposalId: string
  clientEmail: string | null
}

export default function SendProposalButton({ proposalId, clientEmail }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handle() {
    if (!clientEmail) {
      setError("Client has no email address. Add one in Clients first.")
      return
    }
    if (!confirm(`Send this proposal to ${clientEmail}?`)) return
    setLoading(true)
    setError("")
    try {
      const result = await sendProposalToClient(proposalId)
      if ("error" in result) { setError(result.error ?? "Failed to send"); return }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {error && <p className="text-xs text-red-600 mb-1">{error}</p>}
      <button
        onClick={handle}
        disabled={loading}
        className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-lg disabled:opacity-60 transition-colors"
      >
        <Send className="w-4 h-4" />
        {loading ? "Sending…" : "Send to client"}
      </button>
    </div>
  )
}
