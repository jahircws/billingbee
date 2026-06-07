"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Sparkles } from "lucide-react"
import { generateProposal } from "@/app/actions/proposal"

interface Client { id: string; name: string }

export default function NewProposalButton({ clients }: { clients: Client[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [clientId, setClientId] = useState("")
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!clientId || !prompt.trim()) return
    setLoading(true)
    setError("")
    const result = await generateProposal(clientId, prompt)
    setLoading(false)
    if ("error" in result) { setError(result.error ?? "Failed"); return }
    setOpen(false)
    router.push(`/proposals/${result.proposal.id}`)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
      >
        <Sparkles className="w-4 h-4" />
        Generate with AI
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-gray-900">AI Proposal Generator</h2>
            </div>
            <form onSubmit={handleGenerate} className="space-y-3">
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Client</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">Select client…</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">What are you proposing?</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  required
                  rows={3}
                  placeholder="e.g. Website redesign for their e-commerce store, including development and 3 months support"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 text-sm text-gray-600 border border-gray-200 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading || !clientId || !prompt.trim()}
                  className="flex-1 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5">
                  {loading ? (
                    <><span className="animate-spin">✦</span> Generating…</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Generate</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
