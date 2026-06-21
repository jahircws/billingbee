"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Sparkles, Loader2 } from "lucide-react"
import { generateProposal } from "@/app/actions/proposal"
import { createClient } from "@/app/actions/client"

interface Client { id: string; name: string }

export default function NewProposalForm({ clients: initialClients }: { clients: Client[] }) {
  const router = useRouter()
  const [clients, setClients] = useState(initialClients)
  const [clientId, setClientId] = useState("")
  const [prompt, setPrompt] = useState("")
  const [budget, setBudget] = useState("")
  const [timeline, setTimeline] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Inline new-client state
  const [showNewClient, setShowNewClient] = useState(initialClients.length === 0)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [creatingClient, setCreatingClient] = useState(false)
  const [clientError, setClientError] = useState("")

  async function handleCreateClient() {
    if (!newName.trim()) return
    setCreatingClient(true)
    setClientError("")
    try {
      const result = await createClient({ name: newName.trim(), email: newEmail.trim() || undefined })
      if ("error" in result) {
        setClientError(typeof result.error === "string" ? result.error : "Failed to create client")
        return
      }
      const newClient = { id: result.client.id, name: result.client.name }
      setClients((prev) => [...prev, newClient])
      setClientId(newClient.id)
      setNewName("")
      setNewEmail("")
      setShowNewClient(false)
    } catch (err) {
      setClientError(err instanceof Error ? err.message : "Failed to create client")
    } finally {
      setCreatingClient(false)
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!clientId || !prompt.trim()) {
      setError("Please select a client and describe what you're proposing.")
      return
    }
    setLoading(true)
    setError("")
    try {
      const fullPrompt = [
        prompt.trim(),
        budget ? `Budget: ${budget}` : "",
        timeline ? `Timeline: ${timeline}` : "",
      ].filter(Boolean).join("\n")
      const result = await generateProposal(clientId, fullPrompt)
      if ("error" in result) { setError(result.error ?? "Failed"); return }
      router.push(`/proposals/${result.proposal.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate proposal")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleGenerate} className="space-y-4">
      {/* Client */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Client</h2>
        <div className="flex gap-2">
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required={!showNewClient}
            disabled={showNewClient}
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white disabled:opacity-50"
          >
            <option value="">{clients.length === 0 ? "No clients yet" : "Select client…"}</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {!showNewClient && (
            <button
              type="button"
              onClick={() => setShowNewClient(true)}
              className="flex items-center gap-1 text-sm border border-gray-200 rounded-lg px-3 py-2.5 text-gray-600 hover:bg-gray-50 whitespace-nowrap transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> New
            </button>
          )}
        </div>

        {showNewClient && (
          <div className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-100">
            <p className="text-xs font-medium text-gray-600">New client</p>
            {clientError && <p className="text-xs text-red-600">{clientError}</p>}
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name *"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Email (optional)"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreateClient}
                disabled={!newName.trim() || creatingClient}
                className="flex items-center gap-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
              >
                {creatingClient ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                {creatingClient ? "Creating…" : "Create client"}
              </button>
              {clients.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setShowNewClient(false); setClientError("") }}
                  className="text-sm text-gray-500 hover:text-gray-700 px-2"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Project details */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Project details</h2>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500">What are you proposing?</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            required
            rows={4}
            placeholder="e.g. Website redesign for their e-commerce store, including development and 3 months support"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">Budget <span className="text-gray-400">(optional)</span></label>
            <input
              type="text"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. $5,000"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">Timeline <span className="text-gray-400">(optional)</span></label>
            <input
              type="text"
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              placeholder="e.g. 4 weeks"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={loading || !clientId || !prompt.trim()}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60 text-sm"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Generate proposal</>
          )}
        </button>
        <a href="/proposals" className="text-sm text-gray-400 hover:text-gray-600">Cancel</a>
      </div>
    </form>
  )
}
