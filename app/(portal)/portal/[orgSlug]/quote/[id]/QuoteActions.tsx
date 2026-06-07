"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateQuote } from "@/app/actions/quote"

interface Props {
  quoteId: string
  orgSlug: string
}

export default function QuoteActions({ quoteId, orgSlug }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<"accept" | "reject" | null>(null)

  async function handle(status: "ACCEPTED" | "REJECTED") {
    setLoading(status === "ACCEPTED" ? "accept" : "reject")
    await updateQuote(quoteId, { status })
    router.refresh()
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={() => handle("ACCEPTED")}
        disabled={loading !== null}
        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 text-sm"
      >
        {loading === "accept" ? "Accepting…" : "Accept quote"}
      </button>
      <button
        onClick={() => handle("REJECTED")}
        disabled={loading !== null}
        className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 text-sm"
      >
        {loading === "reject" ? "Declining…" : "Decline"}
      </button>
    </div>
  )
}
