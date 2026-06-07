"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { createClient } from "@/app/actions/client"
import UpgradeModal from "@/components/billing/UpgradeModal"

export default function NewClientButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [limitReached, setLimitReached] = useState<{ current: number; limit: number } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError("")
    const result = await createClient({ name, email: email || undefined, phone: phone || undefined })
    setLoading(false)
    if ("error" in result) {
      if (result.error === "LIMIT_REACHED" && "current" in result) {
        setOpen(false)
        setLimitReached({ current: result.current as number, limit: result.limit as number })
        return
      }
      setError(result.error ?? "Failed")
      return
    }
    setOpen(false)
    setName("")
    setEmail("")
    setPhone("")
    router.refresh()
    router.push(`/clients/${result.client.id}`)
  }

  return (
    <>
      {limitReached && (
        <UpgradeModal
          current={limitReached.current}
          limit={limitReached.limit}
          type="client"
          onClose={() => setLimitReached(null)}
        />
      )}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        New client
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">New client</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              {error && <p className="text-sm text-red-600">{error}</p>}
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name *"
                required
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                type="email"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 text-sm text-gray-600 border border-gray-200 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="flex-1 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl disabled:opacity-60 transition-colors"
                >
                  {loading ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
