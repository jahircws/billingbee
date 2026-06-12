"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import ExpenseFormModal, { type Category } from "./ExpenseFormModal"

export default function NewExpenseButton({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add expense
      </button>

      {open && <ExpenseFormModal categories={categories} onClose={() => setOpen(false)} />}
    </>
  )
}
