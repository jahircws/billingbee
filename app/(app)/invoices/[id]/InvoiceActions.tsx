"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  sendInvoice,
  deleteInvoice,
  updateInvoiceStatus,
  duplicateInvoice,
} from "@/app/actions/invoices"
import {
  Send, Trash2, Copy, CheckCircle, Download,
  MoreHorizontal, ExternalLink, Pencil,
} from "lucide-react"

interface Props {
  invoiceId: string
  invoiceNumber: string
  status: string
  clientEmail: string | null
  payLink: string
}

export default function InvoiceActions({ invoiceId, invoiceNumber, status, clientEmail, payLink }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function run(key: string, fn: () => Promise<unknown>) {
    setLoading(key)
    setMsg(null)
    try {
      const res = await fn() as { error?: string; success?: boolean }
      if (res && "error" in res && res.error) {
        setMsg({ text: res.error, ok: false })
      } else {
        setMsg({ text: key === "send" ? "Invoice sent!" : key === "delete" ? "Deleted" : key === "paid" ? "Marked as paid" : "Done", ok: true })
        if (key === "delete") {
          router.push("/invoices")
          router.refresh()
          return
        }
        router.refresh()
      }
    } catch {
      setMsg({ text: "Something went wrong", ok: false })
    } finally {
      setLoading(null)
      setShowMenu(false)
      setTimeout(() => setMsg(null), 4000)
    }
  }

  const isPaid = status === "PAID"

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Send */}
      {clientEmail && !isPaid && (
        <button
          onClick={() => run("send", () => sendInvoice(invoiceId))}
          disabled={!!loading}
          className="flex items-center gap-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-medium px-3 py-2 rounded-lg transition-all disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          {loading === "send" ? "Sending…" : "Send"}
        </button>
      )}

      {/* Mark paid */}
      {!isPaid && (
        <button
          onClick={() => run("paid", () => updateInvoiceStatus(invoiceId, "PAID"))}
          disabled={!!loading}
          className="flex items-center gap-1.5 text-sm bg-white hover:bg-gray-50 active:scale-95 text-gray-700 border border-gray-200 font-medium px-3 py-2 rounded-lg transition-all disabled:opacity-50"
        >
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          {loading === "paid" ? "Saving…" : "Mark paid"}
        </button>
      )}

      {/* Download PDF */}
      <a
        href={`/api/invoice/${invoiceId}/pdf`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-sm bg-white hover:bg-gray-50 active:scale-95 text-gray-700 border border-gray-200 font-medium px-3 py-2 rounded-lg transition-all"
      >
        <Download className="w-3.5 h-3.5" />
        PDF
      </a>

      {/* Pay link */}
      <a
        href={payLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-sm bg-white hover:bg-gray-50 active:scale-95 text-gray-700 border border-gray-200 font-medium px-3 py-2 rounded-lg transition-all"
        title="Open payment page"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        Pay link
      </a>

      {/* More menu */}
      <div className="relative">
        <button
          onClick={() => setShowMenu((v) => !v)}
          className="flex items-center justify-center w-9 h-9 bg-white hover:bg-gray-50 active:scale-95 text-gray-600 border border-gray-200 rounded-lg transition-all"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-full mt-1 z-20 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 text-sm">
              <a
                href={`/invoices/${invoiceId}/edit`}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-700"
                onClick={() => setShowMenu(false)}
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit invoice
              </a>
              <button
                onClick={() => run("duplicate", () => duplicateInvoice(invoiceId).then((r) => {
                  if ("invoice" in r) router.push(`/invoices/${r.invoice.id}`)
                  return r
                }))}
                disabled={!!loading}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-700 disabled:opacity-50"
              >
                <Copy className="w-3.5 h-3.5" />
                Duplicate
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => { setShowMenu(false); setConfirmDelete(true) }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>

      {/* Toast */}
      {msg && (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${msg.ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
          {msg.text}
        </span>
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Delete {invoiceNumber}?</h3>
            <p className="text-sm text-gray-500">This cannot be undone. All line items and follow-ups will be removed.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 text-sm text-gray-600 border border-gray-200 py-2.5 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => { setConfirmDelete(false); run("delete", () => deleteInvoice(invoiceId)) }}
                disabled={!!loading}
                className="flex-1 text-sm bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-xl disabled:opacity-50"
              >
                {loading === "delete" ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
