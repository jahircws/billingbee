"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Send, CheckCircle, Trash2, Copy, ExternalLink } from "lucide-react"
import { sendInvoice, deleteInvoice, updateInvoiceStatus, duplicateInvoice } from "@/app/actions/invoices"

interface Props {
  invoiceId: string
  invoiceNumber: string
  status: string
  clientEmail: string | null
}

export default function InvoiceRowActions({ invoiceId, invoiceNumber, status, clientEmail }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  async function openPayLink() {
    setOpen(false)
    setLoading("paylink")
    try {
      const res = await fetch(`/api/invoice/${invoiceId}/pay-link`)
      const data = await res.json()
      if (data.url) window.open(data.url, "_blank", "noopener")
    } finally {
      setLoading(null)
    }
  }
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function run(key: string, fn: () => Promise<unknown>) {
    setLoading(key)
    setOpen(false)
    try {
      await fn()
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  const isPaid = status === "PAID"

  return (
    <>
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setOpen((v) => !v)}
          disabled={!!loading}
          className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
          title="Actions"
        >
          {loading ? (
            <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
          ) : (
            <MoreHorizontal className="w-4 h-4" />
          )}
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-1 z-20 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 text-sm">
              {clientEmail && !isPaid && (
                <button
                  onClick={() => run("send", () => sendInvoice(invoiceId))}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-700"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-500" />
                  Send to client
                </button>
              )}
              {!isPaid && (
                <button
                  onClick={() => run("paid", () => updateInvoiceStatus(invoiceId, "PAID"))}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-700"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  Mark as paid
                </button>
              )}
              <button
                onClick={openPayLink}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-700"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Pay link
              </button>
              <button
                onClick={() => run("dup", () => duplicateInvoice(invoiceId).then((r) => {
                  if ("invoice" in r && r.invoice) router.push(`/invoices/${r.invoice.id}`)
                  return r
                }))}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-700"
              >
                <Copy className="w-3.5 h-3.5" />
                Duplicate
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => { setOpen(false); setConfirmDelete(true) }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Delete {invoiceNumber}?</h3>
            <p className="text-sm text-gray-500">This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 text-sm text-gray-600 border border-gray-200 py-2.5 rounded-xl hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => { setConfirmDelete(false); run("delete", () => deleteInvoice(invoiceId)) }}
                className="flex-1 text-sm bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-xl"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
