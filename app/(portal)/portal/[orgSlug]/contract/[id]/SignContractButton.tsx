"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signContract } from "@/app/actions/contract"
import { PenLine } from "lucide-react"

interface Props {
  contractId: string
  orgSlug: string
}

export default function SignContractButton({ contractId, orgSlug }: Props) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const canSubmit = name.trim().length >= 2 && agreed && !loading

  async function handleSign() {
    if (!canSubmit) return
    setLoading(true)
    setError("")
    const result = await signContract(contractId)
    if (result && "error" in result) {
      setError(result.error ?? "Failed to sign contract")
      setLoading(false)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <PenLine className="w-4 h-4 text-gray-600" />
        <p className="text-sm font-semibold text-gray-700">E-sign this contract</p>
      </div>
      <p className="text-xs text-gray-500">
        Your typed name constitutes your digital signature and indicates your agreement to the terms above.
      </p>

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Type your full legal name to sign</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Priya Sharma"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          disabled={loading}
        />
      </div>

      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 accent-emerald-600"
          disabled={loading}
        />
        <span className="text-xs text-gray-600">
          I have read and agree to all terms in this contract.
        </span>
      </label>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        onClick={handleSign}
        disabled={!canSubmit}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
      >
        <PenLine className="w-4 h-4" />
        {loading ? "Signing…" : "Sign contract"}
      </button>
    </div>
  )
}
