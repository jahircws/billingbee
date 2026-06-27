"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { recordPayment } from "@/app/actions/invoices"
import { fmtCurrency } from "@/lib/currency"
import { format } from "date-fns"
import { X, DollarSign } from "lucide-react"

const METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "OTHER", label: "UPI" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "RAZORPAY", label: "Other" },
]

interface Props {
  invoiceId: string
  total: number
  amountPaid: number
  currency: string
}

export default function RecordPaymentModal({ invoiceId, total, amountPaid, currency }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remaining = total - amountPaid
  const fmt = (n: number) => fmtCurrency(n, currency)

  const [amount, setAmount] = useState(remaining.toFixed(2))
  const [method, setMethod] = useState("BANK_TRANSFER")
  const [paidAt, setPaidAt] = useState(format(new Date(), "yyyy-MM-dd"))
  const [notes, setNotes] = useState("")

  function openModal() {
    setAmount(remaining.toFixed(2))
    setMethod("BANK_TRANSFER")
    setPaidAt(format(new Date(), "yyyy-MM-dd"))
    setNotes("")
    setError(null)
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) { setError("Enter a valid amount"); return }
    if (amt > remaining + 0.001) { setError(`Amount cannot exceed remaining balance of ${fmt(remaining)}`); return }

    setLoading(true)
    setError(null)
    try {
      const res = await recordPayment(invoiceId, { amount: amt, method, paidAt, notes: notes || undefined })
      if (res && "error" in res && res.error) {
        setError(res.error)
      } else {
        setOpen(false)
        router.refresh()
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={openModal}
        className="flex items-center gap-1.5 text-sm bg-white hover:bg-gray-50 active:scale-95 text-gray-700 border border-gray-200 font-medium px-3 py-2 rounded-lg transition-all"
      >
        <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
        Record Payment
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Record Payment</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Amount received</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={remaining}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Balance remaining: <span className="font-medium text-gray-600">{fmt(Math.max(0, remaining - (parseFloat(amount) || 0)))}</span>
                </p>
              </div>

              {/* Method */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Payment method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Date received</label>
                <input
                  type="date"
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                  required
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Note (optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Bank ref #123"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 text-sm text-gray-600 border border-gray-200 py-2.5 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl disabled:opacity-50"
                >
                  {loading ? "Saving…" : "Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
