"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Sparkles, Loader2 } from "lucide-react"
import { generateProposal } from "@/app/actions/proposal"
import { createClient } from "@/app/actions/client"

interface Client { id: string; name: string }

export default function NewProposalButton({ clients }: { clients: Client[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [clientId, setClientId] = useState("")
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Inline new-client state
  const [localClients, setLocalClients] = useState(clients)
  const [showNewClient, setShowNewClient] = useState(clients.length === 0)
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
      setLocalClients((prev) => [...prev, newClient])
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
    if (!clientId || !prompt.trim()) return
    setLoading(true)
    setError("")
    try {
      const result = await generateProposal(clientId, prompt)
      if ("error" in result) { setError(result.error ?? "Failed"); return }
      setOpen(false)
      router.push(`/proposals/${result.proposal.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate proposal")
    } finally {
      setLoading(false)
    }
  }

  function handleOpen() {
    setOpen(true)
    // Reset inline create form if clients now exist
    if (localClients.length > 0) setShowNewClient(false)
  }

  return (
    <>
      <button
        onClick={handleOpen}
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

              {/* Client selector */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Client</label>
                <div className="flex gap-2">
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required={!showNewClient}
                    disabled={showNewClient}
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white disabled:opacity-50"
                  >
                    <option value="">{localClients.length === 0 ? "No clients yet" : "Select client…"}</option>
                    {localClients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
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
              </div>

              {/* Inline new-client form */}
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
                    {localClients.length > 0 && (
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

              {/* Proposal prompt */}
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
                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
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
