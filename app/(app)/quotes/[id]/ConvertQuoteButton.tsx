"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { convertToInvoice } from "@/app/actions/quote"

export default function ConvertQuoteButton({ quoteId }: { quoteId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleConvert() {
    if (!confirm("Convert this quote to an invoice?")) return
    setLoading(true)
    const result = await convertToInvoice(quoteId)
    setLoading(false)
    if ("error" in result) {
      alert(result.error)
      return
    }
    router.push(`/invoices/${result.invoice.id}`)
  }

  return (
    <button
      onClick={handleConvert}
      disabled={loading}
      className="text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-60"
    >
      {loading ? "Converting…" : "Convert to invoice"}
    </button>
  )
}
