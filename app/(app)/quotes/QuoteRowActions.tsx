"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Trash2, Pencil } from "lucide-react"
import { deleteQuote } from "@/app/actions/quote"

export default function QuoteRowActions({ quoteId, quoteNumber, status }: { quoteId: string; quoteNumber: string; status?: string }) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      await deleteQuote(quoteId)
      router.refresh()
    } finally {
      setLoading(false)
      setConfirm(false)
    }
  }

  return (
    <>
      {status !== "CONVERTED" && (
        <Link
          href={`/quotes/${quoteId}/edit`}
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 text-gray-300 hover:text-blue-500 transition-colors rounded inline-flex"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Link>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); setConfirm(true) }}
        className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded"
        title="Delete"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 text-center">Delete {quoteNumber}?</h3>
            <p className="text-sm text-gray-500 text-center">This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirm(false)} className="flex-1 text-sm text-gray-600 border border-gray-200 py-2.5 rounded-xl hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 text-sm bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-xl disabled:opacity-50"
              >
                {loading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
