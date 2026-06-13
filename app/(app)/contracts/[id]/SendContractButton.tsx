"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Send, Loader2 } from "lucide-react"
import { sendContract } from "@/app/actions/contract"

interface Props {
  contractId: string
}

export default function SendContractButton({ contractId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)

  async function handle() {
    setLoading(true)
    setError("")
    const result = await sendContract(contractId)
    if (result && "error" in result) {
      setError(result.error ?? "Failed to send contract")
      setLoading(false)
    } else {
      setSent(true)
      router.refresh()
    }
  }

  if (sent) {
    return (
      <span className="flex items-center gap-1.5 text-sm text-emerald-700 font-medium px-3 py-1.5">
        ✅ Sent to client
      </span>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handle}
        disabled={loading}
        className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {loading ? "Sending…" : "Send to client"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
