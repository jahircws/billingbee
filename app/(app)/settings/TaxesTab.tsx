"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Plus } from "lucide-react"

interface Tax {
  id: string
  name: string
  rate: unknown
  isDefault: boolean
}

export default function TaxesTab({ taxes: initial, orgId }: { taxes: Tax[]; orgId: string }) {
  const router = useRouter()
  const [taxes, setTaxes] = useState(initial)
  const [name, setName] = useState("")
  const [rate, setRate] = useState("")
  const [adding, setAdding] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !rate) return
    setAdding(true)
    const res = await fetch("/api/settings/taxes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, rate: parseFloat(rate) }),
    })
    const data = await res.json()
    setAdding(false)
    if (data.tax) {
      setTaxes((prev) => [...prev, data.tax])
      setName("")
      setRate("")
      router.refresh()
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/settings/taxes/${id}`, { method: "DELETE" })
    setTaxes((prev) => prev.filter((t) => t.id !== id))
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-900">Tax rates</h2>

      {taxes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="py-2.5 px-4 text-left text-xs text-gray-400 font-medium">Name</th>
                <th className="py-2.5 px-4 text-right text-xs text-gray-400 font-medium">Rate</th>
                <th className="py-2.5 px-4 text-center text-xs text-gray-400 font-medium">Default</th>
                <th className="py-2.5 px-4" />
              </tr>
            </thead>
            <tbody>
              {taxes.map((tax) => (
                <tr key={tax.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-2.5 px-4 font-medium text-gray-800">{tax.name}</td>
                  <td className="py-2.5 px-4 text-right text-gray-600">{Number(tax.rate)}%</td>
                  <td className="py-2.5 px-4 text-center">
                    {tax.isDefault && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                        Default
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => handleDelete(tax.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (e.g. GST 18%)"
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <input
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          placeholder="Rate %"
          type="number"
          min="0"
          max="100"
          step="0.01"
          className="w-24 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          type="submit"
          disabled={adding || !name.trim() || !rate}
          className="flex items-center gap-1 text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg disabled:opacity-60 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </form>
    </div>
  )
}
