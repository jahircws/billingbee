"use client"

import { useState } from "react"
import { fmtCurrency } from "@/lib/currency"
import { useRouter } from "next/navigation"
import { Trash2, Plus } from "lucide-react"

interface Item {
  id: string
  name: string
  description: string | null
  unitPrice: unknown
  unit: string | null
  taxRate: unknown
  hsn: string | null
}

export default function ItemsTab({ items: initial, orgId, currency }: { items: Item[]; orgId: string; currency: string }) {
  const router = useRouter()
  const [items, setItems] = useState(initial)
  const [form, setForm] = useState({ name: "", description: "", unitPrice: "", taxRate: "", unit: "", hsn: "" })
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)

  function setF(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })) }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setAdding(true)
    const res = await fetch("/api/settings/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description || undefined,
        unitPrice: parseFloat(form.unitPrice) || 0,
        taxRate: parseFloat(form.taxRate) || 0,
        unit: form.unit || undefined,
        hsn: form.hsn || undefined,
      }),
    })
    const data = await res.json()
    setAdding(false)
    if (data.item) {
      setItems((prev) => [...prev, data.item])
      setForm({ name: "", description: "", unitPrice: "", taxRate: "", unit: "", hsn: "" })
      setShowForm(false)
      router.refresh()
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/settings/items/${id}`, { method: "DELETE" })
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const fmt = (n: unknown) => fmtCurrency(n, currency)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Products & services</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          <Plus className="w-4 h-4" />
          Add item
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input value={form.name} onChange={(e) => setF("name", e.target.value)} placeholder="Name *" required
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <input value={form.unitPrice} onChange={(e) => setF("unitPrice", e.target.value)} placeholder="Unit price" type="number" min="0" step="0.01"
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <input value={form.description} onChange={(e) => setF("description", e.target.value)} placeholder="Description"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          <div className="grid grid-cols-3 gap-3">
            <input value={form.taxRate} onChange={(e) => setF("taxRate", e.target.value)} placeholder="Tax %" type="number" min="0" max="100" step="0.01"
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <input value={form.unit} onChange={(e) => setF("unit", e.target.value)} placeholder="Unit (hrs, pcs…)"
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <input value={form.hsn} onChange={(e) => setF("hsn", e.target.value)} placeholder="HSN code"
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)}
              className="text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={adding || !form.name.trim()}
              className="text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-60 transition-colors">
              {adding ? "Adding…" : "Add item"}
            </button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-gray-400">No items yet. Add reusable products or services.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="py-2.5 px-4 text-left text-xs text-gray-400 font-medium">Name</th>
                <th className="py-2.5 px-4 text-right text-xs text-gray-400 font-medium">Price</th>
                <th className="py-2.5 px-4 text-right text-xs text-gray-400 font-medium">Tax</th>
                <th className="py-2.5 px-4" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-2.5 px-4">
                    <p className="font-medium text-gray-800">{item.name}</p>
                    {item.description && <p className="text-xs text-gray-400">{item.description}</p>}
                  </td>
                  <td className="py-2.5 px-4 text-right text-gray-600">{fmt(item.unitPrice)}</td>
                  <td className="py-2.5 px-4 text-right text-gray-500">{Number(item.taxRate)}%</td>
                  <td className="py-2.5 px-4 text-right">
                    <button onClick={() => handleDelete(item.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
