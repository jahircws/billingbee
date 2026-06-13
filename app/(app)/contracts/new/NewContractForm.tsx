"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Loader2, X } from "lucide-react"
import { createContract } from "@/app/actions/contract"
import { generateContractContent } from "@/app/actions/ai-draft"

interface Client {
  id: string
  name: string
}

interface Props {
  clients: Client[]
  orgName: string
}

export default function NewContractForm({ clients, orgName }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Form state
  const [clientId, setClientId] = useState("")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [error, setError] = useState("")

  // AI modal state
  const [aiOpen, setAiOpen] = useState(false)
  const [aiScope, setAiScope] = useState("")
  const [aiDeliverables, setAiDeliverables] = useState("")
  const [aiTimeline, setAiTimeline] = useState("")
  const [aiAmount, setAiAmount] = useState("")
  const [aiCurrency, setAiCurrency] = useState("INR")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState("")

  const selectedClient = clients.find((c) => c.id === clientId)

  async function handleAiGenerate() {
    if (!selectedClient || !aiScope || !aiDeliverables || !aiTimeline || !aiAmount) {
      setAiError("Please fill in all fields before generating.")
      return
    }
    setAiLoading(true)
    setAiError("")
    const result = await generateContractContent({
      clientName: selectedClient.name,
      orgName,
      scope: aiScope,
      deliverables: aiDeliverables,
      timeline: aiTimeline,
      amount: Number(aiAmount),
      currency: aiCurrency,
    })
    if ("error" in result) {
      setAiError(result.error)
    } else {
      setContent(result.content)
      if (!title) setTitle(`Contract — ${selectedClient.name}`)
      setAiOpen(false)
    }
    setAiLoading(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientId || !title.trim() || !content.trim()) {
      setError("Client, title, and contract content are required.")
      return
    }
    setError("")
    startTransition(async () => {
      const result = await createContract({ clientId, title, content })
      if (result && "error" in result) {
        setError(result.error ?? "Failed to create contract")
      } else if (result && "contract" in result && result.contract) {
        router.push(`/contracts/${(result.contract as { id: string }).id}`)
      }
    })
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Client */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Client</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="">Select a client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Contract title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Website Design Contract — Acme Corp"
            required
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Contract content</label>
            <button
              type="button"
              onClick={() => {
                if (!clientId) { setError("Select a client first to use AI drafting."); return }
                setError("")
                setAiOpen(true)
              }}
              className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate with AI ✨
            </button>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste or type your contract here, or use AI to generate it…"
            rows={16}
            required
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono leading-relaxed resize-y"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60 text-sm"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPending ? "Saving…" : "Create contract"}
          </button>
          <a href="/contracts" className="text-sm text-gray-400 hover:text-gray-600">Cancel</a>
        </div>
      </form>

      {/* AI Draft Modal */}
      {aiOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-semibold text-gray-900">AI Contract Generator</h2>
              </div>
              <button onClick={() => setAiOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Drafting for <strong>{selectedClient?.name}</strong> from <strong>{orgName}</strong>
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Scope of work</label>
                <textarea
                  value={aiScope}
                  onChange={(e) => setAiScope(e.target.value)}
                  placeholder="e.g. Design and develop a 5-page responsive website"
                  rows={2}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Deliverables</label>
                <textarea
                  value={aiDeliverables}
                  onChange={(e) => setAiDeliverables(e.target.value)}
                  placeholder="e.g. Homepage, About, Services, Portfolio, Contact pages + mobile-responsive design"
                  rows={2}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Timeline</label>
                <input
                  type="text"
                  value={aiTimeline}
                  onChange={(e) => setAiTimeline(e.target.value)}
                  placeholder="e.g. 3 weeks from project kick-off"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium text-gray-600">Amount</label>
                  <input
                    type="number"
                    value={aiAmount}
                    onChange={(e) => setAiAmount(e.target.value)}
                    placeholder="25000"
                    min="0"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="w-24 space-y-1">
                  <label className="text-xs font-medium text-gray-600">Currency</label>
                  <select
                    value={aiCurrency}
                    onChange={(e) => setAiCurrency(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
            </div>

            {aiError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{aiError}</p>
            )}

            <button
              onClick={handleAiGenerate}
              disabled={aiLoading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60 text-sm"
            >
              {aiLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate contract</>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
