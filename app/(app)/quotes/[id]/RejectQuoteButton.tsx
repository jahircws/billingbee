"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { rejectQuote } from "@/app/actions/quote"

export default function RejectQuoteButton({ quoteId }: { quoteId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleReject() {
    setLoading(true)
    setShowConfirm(false)
    try {
      const result = await rejectQuote(quoteId)
      if ("error" in result) {
        setErrorMsg(result.error as string)
        return
      }
      router.refresh()
    } catch {
      setErrorMsg("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Mark as rejected?</h3>
            <p className="text-sm text-gray-500">The client will receive an email letting them know this quote was not accepted.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="text-sm px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
              >
                Mark Rejected
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Error</h3>
            <p className="text-sm text-gray-500">{errorMsg}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setErrorMsg(null)}
                className="text-sm px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setShowConfirm(true)}
        disabled={loading}
        className="text-sm bg-red-50 hover:bg-red-100 text-red-600 font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-60"
      >
        {loading ? "Rejecting…" : "Mark Rejected"}
      </button>
    </>
  )
}
