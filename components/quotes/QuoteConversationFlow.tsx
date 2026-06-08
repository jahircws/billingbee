"use client"

import { useState } from "react"
import { MessageSquare, Loader2, ArrowLeft, Sparkles } from "lucide-react"
import InvoiceForm from "@/components/invoices/InvoiceForm"

interface Client {
  id: string
  name: string
  email?: string | null
}

interface ExtractedData {
  clientName: string | null
  clientEmail: string | null
  items: { description: string; qty: number; rate: number }[]
  currency: string
  totalAmount: number | null
  dueDate: string | null
  notes: string | null
  confidence: "high" | "medium" | "low"
}

interface Props {
  clients: Client[]
  isPro?: boolean
}

export default function QuoteConversationFlow({ clients, isPro = false }: Props) {
  const [step, setStep] = useState<"paste" | "review" | "manual">("paste")
  const [text, setText] = useState("")
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState("")
  const [extracted, setExtracted] = useState<ExtractedData | null>(null)

  async function handleExtract() {
    if (!text.trim()) return
    setExtracting(true)
    setError("")

    try {
      const blob = new Blob([text], { type: "text/plain" })
      const file = new File([blob], "conversation.txt", { type: "text/plain" })
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/ai/extract", { method: "POST", body: formData })
      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error ?? "Extraction failed. Try again.")
        return
      }

      setExtracted(data.extraction)
      setStep("review")
    } catch {
      setError("Network error — check your connection.")
    } finally {
      setExtracting(false)
    }
  }

  if (step === "manual") {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setStep("paste")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to conversation paste
        </button>
        <InvoiceForm type="quote" clients={clients} isPro={isPro} />
      </div>
    )
  }

  if (step === "review" && extracted) {
    // Find matching client by name or email
    const matchedClient = clients.find((c) => {
      if (extracted.clientEmail && c.email?.toLowerCase() === extracted.clientEmail.toLowerCase()) return true
      if (extracted.clientName && c.name.toLowerCase().includes(extracted.clientName.toLowerCase())) return true
      return false
    })

    // Build default amount from items or totalAmount
    const defaultAmount =
      extracted.items?.length
        ? extracted.items.reduce((s, i) => s + i.qty * i.rate, 0)
        : (extracted.totalAmount ?? undefined)

    const defaultDescription =
      extracted.items?.length === 1
        ? extracted.items[0].description
        : extracted.items?.map((i) => i.description).join(", ") || undefined

    return (
      <div className="space-y-4">
        {/* Extraction summary banner */}
        <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${
          extracted.confidence === "high"
            ? "bg-emerald-50 border-emerald-100 text-emerald-800"
            : extracted.confidence === "medium"
            ? "bg-amber-50 border-amber-100 text-amber-800"
            : "bg-gray-50 border-gray-100 text-gray-600"
        }`}>
          <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">
              {extracted.confidence === "high" ? "High confidence extraction" :
               extracted.confidence === "medium" ? "Partial extraction — review carefully" :
               "Low confidence — fill in the blanks"}
            </span>
            {extracted.clientName && <span className="ml-2 font-normal">· {extracted.clientName}</span>}
            {defaultAmount ? <span className="ml-2 font-normal">· ₹{defaultAmount.toLocaleString("en-IN")}</span> : null}
          </div>
          <button
            onClick={() => { setStep("paste"); setExtracted(null) }}
            className="flex items-center gap-1 text-xs opacity-60 hover:opacity-100 shrink-0"
          >
            <ArrowLeft className="w-3 h-3" /> Re-paste
          </button>
        </div>

        <InvoiceForm
          type="quote"
          clients={clients}
          isPro={isPro}
          defaultClientId={matchedClient?.id}
          defaultClientName={extracted.clientName ?? undefined}
          defaultAmount={defaultAmount}
          defaultDescription={defaultDescription}
          defaultDueDate={extracted.dueDate ?? undefined}
        />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
          <MessageSquare className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Paste your conversation</h2>
          <p className="text-xs text-gray-400">Chat, email, WhatsApp — AI extracts client, items &amp; amounts</p>
        </div>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        placeholder={`Paste a chat or email here, e.g.\n\n"Hi, can you send me a quote for the logo design project? Budget is around ₹15,000. Need it done by end of month.\n— Rahul Mehta, rahul@acmecorp.in"`}
        className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-gray-700 placeholder-gray-300 leading-relaxed"
      />

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleExtract}
          disabled={!text.trim() || extracting}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          {extracting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Extracting…</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Build quote from conversation</>
          )}
        </button>
        <span className="text-xs text-gray-400">or</span>
        <button
          onClick={() => setStep("manual")}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          fill manually
        </button>
      </div>
    </div>
  )
}
