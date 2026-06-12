"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { sendQuote } from "@/app/actions/quote"

export default function SendQuoteButton({ quoteId, hasEmail }: { quoteId: string; hasEmail: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSend() {
    if (!hasEmail) {
      alert("Add an email address to this client before sending.")
      return
    }
    setLoading(true)
    try {
      const result = await sendQuote(quoteId)
      if ("error" in result) {
        alert(result.error)
        return
      }
      setSent(true)
      router.refresh()
    } catch {
      alert("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSend}
      disabled={loading}
      className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-60"
    >
      {loading ? "Sending…" : sent ? "Sent ✓" : "Send to client"}
    </button>
  )
}
