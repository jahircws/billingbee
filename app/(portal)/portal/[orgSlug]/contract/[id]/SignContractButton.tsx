"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signContract } from "@/app/actions/proposal"
import { PenLine } from "lucide-react"

interface Props {
  contractId: string
  orgSlug: string
}

export default function SignContractButton({ contractId, orgSlug }: Props) {
  const router = useRouter()
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSign() {
    setLoading(true)
    await signContract(contractId)
    router.refresh()
  }

  if (!confirmed) {
    return (
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <PenLine className="w-4 h-4 text-gray-600" />
          <p className="text-sm font-semibold text-gray-700">E-sign this contract</p>
        </div>
        <p className="text-xs text-gray-500">
          By clicking &ldquo;Sign contract&rdquo; below, you agree to the terms outlined in this document.
          Your electronic signature is legally binding.
        </p>
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5"
          />
          <span className="text-xs text-gray-600">
            I have read and agree to all terms in this contract.
          </span>
        </label>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <PenLine className="w-4 h-4 text-gray-600" />
        <p className="text-sm font-semibold text-gray-700">E-sign this contract</p>
      </div>
      <p className="text-xs text-gray-500">
        By clicking &ldquo;Sign contract&rdquo; below, you agree to the terms outlined in this document.
      </p>
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5"
        />
        <span className="text-xs text-gray-600">
          I have read and agree to all terms in this contract.
        </span>
      </label>
      <button
        onClick={handleSign}
        disabled={loading}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 text-sm flex items-center justify-center gap-2"
      >
        <PenLine className="w-4 h-4" />
        {loading ? "Signing…" : "Sign contract"}
      </button>
    </div>
  )
}
