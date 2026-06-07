"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { convertToContract } from "@/app/actions/proposal"
import { FileSignature } from "lucide-react"

export default function ConvertToContractButton({ proposalId }: { proposalId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handle() {
    if (!confirm("Generate a legal contract from this proposal using AI?")) return
    setLoading(true)
    const result = await convertToContract(proposalId)
    setLoading(false)
    if ("error" in result) { alert(result.error); return }
    router.push(`/contracts/${result.contract.id}`)
  }

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="flex items-center gap-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white font-medium px-3 py-1.5 rounded-lg disabled:opacity-60 transition-colors"
    >
      <FileSignature className="w-4 h-4" />
      {loading ? "Generating…" : "Convert to contract"}
    </button>
  )
}
