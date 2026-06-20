"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MoreHorizontal, Send, CheckCircle, Trash2, Copy, ExternalLink, Edit2, Bell, Link2, Check } from "lucide-react"
import { sendInvoice, deleteInvoice, updateInvoiceStatus, duplicateInvoice, sendReminder } from "@/app/actions/invoices"
import UpgradeModal from "@/components/billing/UpgradeModal"

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
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [copied, setCopied] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setMenuPos({ top: rect.bottom + window.scrollY + 4, right: window.innerWidth - rect.right })
    }
  }, [open])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

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

  async function copyPayLink() {
    try {
      const res = await fetch(`/api/invoice/${invoiceId}/pay-link`)
      const data = await res.json()
      if (data.url) {
        await navigator.clipboard.writeText(data.url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      setToast({ msg: "Could not copy link", ok: false })
    }
  }

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [limitReached, setLimitReached] = useState<{ current: number; limit: number } | null>(null)

  async function run(key: string, fn: () => Promise<{ error?: unknown } | { success?: boolean } | unknown>) {
    setLoading(key)
    setOpen(false)
    try {
      const result = await fn() as { error?: string; current?: number; limit?: number } | null
      if (result && "error" in result && result.error === "LIMIT_REACHED") {
        setLimitReached({ current: result.current as number, limit: result.limit as number })
      } else if (result && "error" in result && result.error) {
        setToast({ msg: String(result.error), ok: false })
      } else if (key === "send") {
        setToast({ msg: "Invoice sent to client", ok: true })
      } else if (key === "reminder") {
        setToast({ msg: "Reminder sent to client", ok: true })
      }
      router.refresh()
    } catch {
      setToast({ msg: "Something went wrong", ok: false })
    } finally {
      setLoading(null)
    }
  }

  const isDraft = status === "DRAFT"
  const isPaid = status === "PAID"
  const canPay = status === "UNPAID" || status === "OVERDUE"
  const canRemind = canPay && !!clientEmail

  return (
    <>
      {limitReached && (
        <UpgradeModal
          current={limitReached.current}
          limit={limitReached.limit}
          type="invoice"
          onClose={() => setLimitReached(null)}
        />
      )}
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium transition-all ${
            toast.ok ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
        {canPay && (
          <button
            onClick={copyPayLink}
            className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-150"
            title="Copy pay link"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Link2 className="w-3.5 h-3.5" />}
          </button>
        )}
        <div className="relative">
        <button
          ref={buttonRef}
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
            <div
              className="fixed z-20 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 text-sm"
              style={{ top: menuPos.top, right: menuPos.right }}
            >
              {isDraft && (
                <Link
                  href={`/invoices/${invoiceId}/edit`}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-700"
                  onClick={() => setOpen(false)}
                >
                  <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                  Edit
                </Link>
              )}
              {isDraft && (
                <button
                  onClick={() => run("marksent", () => updateInvoiceStatus(invoiceId, "UNPAID"))}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-700"
                >
                  <Send className="w-3.5 h-3.5 text-indigo-500" />
                  Mark as sent
                </button>
              )}
              {clientEmail && !isPaid && (
                <button
                  onClick={() => run("send", () => sendInvoice(invoiceId))}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-700"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-500" />
                  Send to client
                </button>
              )}
              {canRemind && (
                <button
                  onClick={() => run("reminder", () => sendReminder(invoiceId))}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-700"
                >
                  <Bell className="w-3.5 h-3.5 text-amber-500" />
                  Send reminder
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
              {canPay && (
                <button
                  onClick={openPayLink}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-700"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Pay link
                </button>
              )}
              <button
                onClick={() => run("dup", () => duplicateInvoice(invoiceId))}
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
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 text-center">Delete {invoiceNumber}?</h3>
            <p className="text-sm text-gray-500 text-center">This cannot be undone.</p>
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
