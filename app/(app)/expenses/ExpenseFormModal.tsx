"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createExpense, updateExpense, createCategory } from "@/app/actions/expense"

export interface Category { id: string; name: string; color?: string | null }

export interface ExpenseInitial {
  id: string
  title: string
  amount: number
  currency?: string
  date: string // yyyy-MM-dd
  vendor?: string | null
  categoryId?: string | null
  notes?: string | null
}

interface Props {
  categories: Category[]
  expense?: ExpenseInitial // present → edit mode
  onClose: () => void
}

export default function ExpenseFormModal({ categories: initialCategories, expense, onClose }: Props) {
  const router = useRouter()
  const editMode = !!expense
  const [categories, setCategories] = useState(initialCategories)
  const [title, setTitle] = useState(expense?.title ?? "")
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "")
  const [currency, setCurrency] = useState(expense?.currency ?? "INR")
  const [date, setDate] = useState(expense?.date ?? new Date().toISOString().split("T")[0])
  const [vendor, setVendor] = useState(expense?.vendor ?? "")
  const [categoryId, setCategoryId] = useState(expense?.categoryId ?? "")
  const [notes, setNotes] = useState(expense?.notes ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [addingCategory, setAddingCategory] = useState(false)
  const [newCategory, setNewCategory] = useState("")

  async function handleAddCategory() {
    const name = newCategory.trim()
    if (!name) return
    const result = await createCategory({ name })
    if ("error" in result) {
      setError(result.error ?? "Failed to add category")
      return
    }
    setCategories((prev) =>
      prev.some((c) => c.id === result.category.id) ? prev : [...prev, result.category].sort((a, b) => a.name.localeCompare(b.name))
    )
    setCategoryId(result.category.id)
    setNewCategory("")
    setAddingCategory(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !amount) return
    setLoading(true)
    setError("")
    const payload = {
      title,
      amount: parseFloat(amount),
      currency,
      date,
      vendor: vendor || undefined,
      categoryId: categoryId || undefined,
      notes: notes || undefined,
    }
    const result = editMode
      ? await updateExpense(expense!.id, payload)
      : await createExpense(payload)
    setLoading(false)
    if ("error" in result) {
      setError(result.error ?? "Failed")
      return
    }
    onClose()
    router.refresh()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-900">{editMode ? "Edit expense" : "New expense"}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title *"
            required
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount *"
              type="number"
              min="0"
              step="0.01"
              required
              className="text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              {["INR","USD","EUR","GBP","CAD","AUD","SGD","AED","PKR","BDT"].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              value={date}
              onChange={(e) => setDate(e.target.value)}
              type="date"
              required
              className="text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <input
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="Vendor"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          {/* Category with inline add */}
          {addingCategory ? (
            <div className="flex gap-2">
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="New category name"
                autoFocus
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button type="button" onClick={handleAddCategory} className="text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-3 rounded-lg">Add</button>
              <button type="button" onClick={() => { setAddingCategory(false); setNewCategory("") }} className="text-sm text-gray-500 px-2">✕</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button type="button" onClick={() => setAddingCategory(true)} className="text-sm text-emerald-600 hover:bg-emerald-50 px-3 rounded-lg border border-gray-200">+ Category</button>
            </div>
          )}

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes"
            rows={2}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 text-sm text-gray-600 border border-gray-200 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !amount}
              className="flex-1 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl disabled:opacity-60 transition-colors"
            >
              {loading ? "Saving…" : editMode ? "Save changes" : "Add expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
