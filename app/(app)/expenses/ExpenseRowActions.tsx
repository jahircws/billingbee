"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Pencil, FileText } from "lucide-react"
import { deleteExpense, updateExpense } from "@/app/actions/expense"
import ExpenseFormModal, { type Category, type ExpenseInitial } from "./ExpenseFormModal"

interface Props {
  expenseId: string
  title: string
  amount: number
  currency: string
  date: string // yyyy-MM-dd
  vendor?: string | null
  categoryId?: string | null
  notes?: string | null
  isConverted?: boolean
  categories: Category[]
}

export default function ExpenseRowActions({ expenseId, title, amount, currency, date, vendor, categoryId, notes, isConverted = false, categories }: Props) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      await deleteExpense(expenseId)
      router.refresh()
    } finally {
      setLoading(false)
      setConfirm(false)
    }
  }

  async function handleConvert(e: React.MouseEvent) {
    e.stopPropagation()
    await updateExpense(expenseId, { isReimbursed: true })
    const params = new URLSearchParams({ amount: String(amount), description: title, currency })
    router.push(`/invoices/new?${params.toString()}`)
  }

  const initial: ExpenseInitial = { id: expenseId, title, amount, currency, date, vendor, categoryId, notes }

  return (
    <>
      <div className="inline-flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={(e) => { e.stopPropagation(); setEditing(true) }}
          className="p-1.5 text-gray-300 hover:text-blue-500 transition-colors rounded"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleConvert}
          disabled={isConverted}
          className={`p-1.5 transition-colors rounded ${isConverted ? "text-gray-200 cursor-not-allowed" : "text-gray-300 hover:text-emerald-600"}`}
          title={isConverted ? "Already converted to invoice" : "Convert to invoice"}
        >
          <FileText className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setConfirm(true) }}
          className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {editing && (
        <ExpenseFormModal categories={categories} expense={initial} onClose={() => setEditing(false)} />
      )}

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 text-center">Delete &quot;{title}&quot;?</h3>
            <p className="text-sm text-gray-500 text-center">This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirm(false)} className="flex-1 text-sm text-gray-600 border border-gray-200 py-2.5 rounded-xl hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 text-sm bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-xl disabled:opacity-50"
              >
                {loading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
