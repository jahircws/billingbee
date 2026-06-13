"use client"

import { useState, useEffect } from "react"
import { PenLine, Loader2 } from "lucide-react"
import { signContractWithProof, markContractViewed } from "@/app/actions/contract"

interface Props {
  token: string
  status: string
  signedBy?: string | null
  signedAt?: Date | null
}

export default function ContractSignForm({ token, status, signedBy, signedAt }: Props) {
  const [name, setName] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  // Track first view — fire-and-forget, never blocks render
  useEffect(() => {
    if (status === "SENT") {
      markContractViewed(token).catch(() => {})
    }
  }, [token, status])

  if (status === "SIGNED" || success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 flex items-start gap-3">
        <span className="text-emerald-600 text-lg mt-0.5">✅</span>
        <div>
          <p className="text-sm font-semibold text-emerald-800">Contract signed</p>
          {signedBy && signedAt && (
            <p className="text-xs text-emerald-700 mt-0.5">
              Signed by {signedBy} on{" "}
              {new Date(signedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          )}
          {success && !signedAt && (
            <p className="text-xs text-emerald-700 mt-0.5">
              Your signature has been recorded. The sender will be notified.
            </p>
          )}
        </div>
      </div>
    )
  }

  if (status !== "SENT") {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-sm text-gray-500">
        This contract is not ready for signing yet.
      </div>
    )
  }

  const canSubmit = name.trim().length >= 2 && agreed && !loading

  async function handleSign() {
    if (!canSubmit) return
    setLoading(true)
    setError("")
    const result = await signContractWithProof(token, {
      signedBy: name.trim(),
      signatureData: `typed:${name.trim()}`,
    })
    if (result && "error" in result) {
      setError(result.error ?? "Failed to sign contract")
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <PenLine className="w-4 h-4 text-gray-600" />
        <p className="text-sm font-semibold text-gray-700">Sign this contract</p>
      </div>
      <p className="text-xs text-gray-500">
        Your electronic signature is legally binding under the Information Technology Act, 2000 (India).
        Typing your name below constitutes your agreement to all terms in this document.
      </p>

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Your full legal name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Priya Sharma"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          disabled={loading}
          autoComplete="name"
        />
      </div>

      <label className="flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 accent-emerald-600"
          disabled={loading}
        />
        <span className="text-xs text-gray-600 leading-relaxed">
          I have read and understood this contract and agree to all its terms and conditions.
        </span>
      </label>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        onClick={handleSign}
        disabled={!canSubmit}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Signing…</>
        ) : (
          <><PenLine className="w-4 h-4" /> Sign contract</>
        )}
      </button>

      <p className="text-xs text-center text-gray-400">
        Secured by BillingBee · Your IP and timestamp are recorded for legal proof
      </p>
    </div>
  )
}
