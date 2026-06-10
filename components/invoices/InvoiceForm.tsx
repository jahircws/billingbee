"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, ChevronDown, Upload, X } from "lucide-react"
import { createInvoice, updateInvoiceWithItems } from "@/app/actions/invoices"
import { createQuote } from "@/app/actions/quote"
import { createClient } from "@/app/actions/client"
import UpgradeModal from "@/components/billing/UpgradeModal"

interface Client {
  id: string
  name: string
  email?: string | null
}

interface LineItem {
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
}

interface InitialData {
  invoiceId: string
  clientId: string
  dueDate?: string
  notes?: string
  terms?: string
  currency: string
  autoFollowUp: boolean
  items: LineItem[]
}

interface Props {
  type?: "invoice" | "quote"
  clients: Client[]
  defaultClientId?: string
  defaultClientName?: string
  defaultAmount?: number
  defaultDescription?: string
  defaultDueDate?: string
  isPro?: boolean
  uploadMode?: boolean
  defaultCurrency?: string
  initialData?: InitialData
}

const DRAFT_KEY = "billingbee_draft_invoice"

function calcItem(item: LineItem) {
  const subtotal = item.quantity * item.unitPrice
  return subtotal + subtotal * (item.taxRate / 100)
}

export default function InvoiceForm({
  type = "invoice",
  clients,
  defaultClientId,
  defaultClientName,
  defaultAmount,
  defaultDescription,
  defaultDueDate,
  isPro = false,
  uploadMode = false,
  defaultCurrency = "INR",
  initialData,
}: Props) {
  const editMode = !!initialData
  const router = useRouter()
  const [clientId, setClientId] = useState(initialData?.clientId ?? defaultClientId ?? "")
  const [dueDate, setDueDate] = useState(initialData?.dueDate ?? defaultDueDate ?? "")
  const [notes, setNotes] = useState(initialData?.notes ?? "")
  const [terms, setTerms] = useState(initialData?.terms ?? "")
  const [showNotesTerms, setShowNotesTerms] = useState(!!(initialData?.notes || initialData?.terms))
  const [autoFollowUp, setAutoFollowUp] = useState(initialData?.autoFollowUp ?? isPro)
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringFrequency, setRecurringFrequency] = useState<"weekly" | "monthly" | "quarterly">("monthly")
  const [items, setItems] = useState<LineItem[]>(
    initialData?.items ?? [
      {
        description: defaultDescription ?? "",
        quantity: 1,
        unitPrice: defaultAmount ?? 0,
        taxRate: 0,
      },
    ]
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [limitReached, setLimitReached] = useState<{ current: number; limit: number } | null>(null)

  // Upload mode
  const [uploadStep, setUploadStep] = useState<"idle" | "extracting" | "done">(uploadMode ? "idle" : "done")
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleUploadFile(file: File) {
    setUploadFile(file)
    setUploadError("")
    setUploadStep("extracting")
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await fetch("/api/ai/extract", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Extraction failed")
      const ex = data.extraction
      if (ex.clientName) setNewClientName(ex.clientName)
      if (ex.clientName && !defaultClientId) setShowNewClient(true)
      if (ex.dueDate) setDueDate(ex.dueDate)
      if (ex.notes) { setNotes(ex.notes); setShowNotesTerms(true) }
      if (ex.items?.length) {
        setItems(ex.items.map((i: { description: string; qty: number; rate: number }) => ({
          description: i.description ?? "",
          quantity: i.qty ?? 1,
          unitPrice: i.rate ?? 0,
          taxRate: 0,
        })))
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Could not read document")
    } finally {
      setUploadStep("done")
    }
  }

  // Create new client inline — pre-fill from copilot if clientName provided without clientId
  const [showNewClient, setShowNewClient] = useState(!defaultClientId && !!defaultClientName)
  const [newClientName, setNewClientName] = useState((!defaultClientId && defaultClientName) ? defaultClientName : "")
  const [newClientEmail, setNewClientEmail] = useState("")
  const [creatingClient, setCreatingClient] = useState(false)
  const [localClients, setLocalClients] = useState(clients)

  const [currency, setCurrency] = useState(initialData?.currency ?? defaultCurrency)
  const total = items.reduce((s, i) => s + calcItem(i), 0)
  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency, minimumFractionDigits: 2 }).format(n)

  // Auto-save draft to localStorage (skip in edit mode)
  const saveDraft = useCallback(() => {
    if (editMode) return
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ clientId, dueDate, notes, terms, items }))
  }, [editMode, clientId, dueDate, notes, terms, items])

  useEffect(() => {
    if (editMode) return
    const saved = localStorage.getItem(DRAFT_KEY)
    if (saved && !defaultClientId) {
      try {
        const d = JSON.parse(saved)
        if (d.items?.length) {
          setClientId(d.clientId ?? "")
          setDueDate(d.dueDate ?? "")
          setNotes(d.notes ?? "")
          setTerms(d.terms ?? "")
          if (d.notes || d.terms) setShowNotesTerms(true)
          setItems(d.items)
        }
      } catch {}
    }
  }, [defaultClientId])

  useEffect(() => {
    const timer = setInterval(saveDraft, 30000)
    return () => clearInterval(timer)
  }, [saveDraft])

  function addItem() {
    setItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0, taxRate: 0 }])
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateItem(idx: number, field: keyof LineItem, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, [field]: field === "description" ? value : Number(value) } : item
      )
    )
  }

  function handleKeyDown(e: React.KeyboardEvent, idx: number) {
    if (e.key === "Enter" && idx === items.length - 1) {
      e.preventDefault()
      addItem()
    }
  }

  async function handleCreateClient() {
    if (!newClientName.trim()) return
    setCreatingClient(true)
    const result = await createClient({ name: newClientName.trim(), email: newClientEmail || undefined })
    setCreatingClient(false)
    if ("error" in result) {
      setError(result.error ?? "Failed to create client")
      return
    }
    setLocalClients((prev) => [...prev, result.client])
    setClientId(result.client.id)
    setShowNewClient(false)
    setNewClientName("")
    setNewClientEmail("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientId) { setError("Select a client"); return }
    if (items.some((i) => !i.description.trim())) { setError("All items need a description"); return }

    setSubmitting(true)
    setError("")

    const cronByFrequency = {
      weekly: "0 9 * * 1",
      monthly: "0 9 1 * *",
      quarterly: "0 9 1 1,4,7,10 *",
    }

    const payload = {
      clientId,
      currency,
      dueDate: dueDate || undefined,
      notes: notes || undefined,
      terms: terms || undefined,
      autoFollowUp,
      isRecurring: type === "invoice" ? isRecurring : false,
      recurringCron: type === "invoice" && isRecurring ? cronByFrequency[recurringFrequency] : undefined,
      items: items.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        taxRate: i.taxRate,
      })),
    }

    let result: Record<string, unknown>
    if (editMode && initialData) {
      result = await updateInvoiceWithItems(initialData.invoiceId, payload) as Record<string, unknown>
    } else if (type === "invoice") {
      result = await createInvoice(payload) as Record<string, unknown>
    } else {
      result = await createQuote(payload) as Record<string, unknown>
    }

    setSubmitting(false)

    if ("error" in result) {
      const r = result as { error?: unknown; current?: unknown; limit?: unknown }
      if (r.error === "LIMIT_REACHED") {
        setLimitReached({ current: r.current as number, limit: r.limit as number })
        setSubmitting(false)
        return
      }
      setError(String(r.error ?? "Error"))
      return
    }

    localStorage.removeItem(DRAFT_KEY)

    localStorage.removeItem(DRAFT_KEY)

    if (editMode && "invoiceId" in result) {
      router.push(`/invoices/${result.invoiceId}`)
    } else if (type === "invoice" && "invoiceId" in result) {
      router.push(`/invoices/${result.invoiceId}`)
    } else if (type === "quote" && "quote" in result) {
      router.push(`/quotes/${(result.quote as { id: string }).id}`)
    }
  }

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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Upload section */}
      {uploadMode && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Upload invoice document</h3>
            {uploadFile && uploadStep === "done" && (
              <button
                type="button"
                onClick={() => { setUploadFile(null); setUploadStep("idle"); setUploadError("") }}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Remove
              </button>
            )}
          </div>
          {uploadStep === "extracting" ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-4 justify-center">
              <svg className="animate-spin w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Reading document…
            </div>
          ) : uploadFile && uploadStep === "done" ? (
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
              <Upload className="w-4 h-4" />
              <span className="truncate">{uploadFile.name}</span>
              <span className="ml-auto text-xs text-emerald-600">Fields pre-filled below</span>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                const f = e.dataTransfer.files[0]
                if (f) handleUploadFile(f)
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                dragOver ? "border-emerald-400 bg-emerald-50" : "border-gray-200 hover:border-emerald-300 hover:bg-gray-50"
              }`}
            >
              <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Drop a PDF or image here, or <span className="text-emerald-600 font-medium">browse</span></p>
              <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG, WEBP — max 10MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadFile(f) }}
              />
            </div>
          )}
          {uploadError && (
            <p className="text-xs text-red-600">{uploadError}</p>
          )}
        </div>
      )}

      {/* Client */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Client</h3>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">Select client…</option>
              {localClients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <button
            type="button"
            onClick={() => setShowNewClient(!showNewClient)}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium px-3 py-2 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors whitespace-nowrap"
          >
            + New
          </button>
        </div>

        {showNewClient && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <input
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              placeholder="Client name *"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              value={newClientEmail}
              onChange={(e) => setNewClientEmail(e.target.value)}
              placeholder="Email (optional)"
              type="email"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={handleCreateClient}
              disabled={creatingClient || !newClientName.trim()}
              className="text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
            >
              {creatingClient ? "Creating…" : "Create client"}
            </button>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              {type === "quote" ? "Expiry date" : "Due date"}
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Currency</label>
            <div className="relative">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {["USD","EUR","GBP","INR","AUD","CAD","SGD","AED","JPY"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
        {!showNotesTerms ? (
          <button
            type="button"
            onClick={() => setShowNotesTerms(true)}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
          >
            + Add notes &amp; terms
          </button>
        ) : (
          <>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Notes to client…"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Terms</label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={2}
                placeholder="Payment terms…"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>
          </>
        )}
      </div>

      {/* Line items */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Items</h3>

        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <input
                className="col-span-5 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Description"
                value={item.description}
                onChange={(e) => updateItem(idx, "description", e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
              />
              <input
                className="col-span-2 text-sm border border-gray-200 rounded-lg px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                type="number"
                min="0"
                step="0.001"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => updateItem(idx, "quantity", e.target.value)}
              />
              <input
                className="col-span-2 text-sm border border-gray-200 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
                type="number"
                min="0"
                step="0.01"
                placeholder="Rate"
                value={item.unitPrice}
                onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
              />
              <input
                className="col-span-2 text-sm border border-gray-200 rounded-lg px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="Tax%"
                value={item.taxRate}
                onChange={(e) => updateItem(idx, "taxRate", e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeItem(idx)}
                disabled={items.length === 1}
                className="col-span-1 flex justify-center text-gray-300 hover:text-red-400 disabled:opacity-20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            <Plus className="w-4 h-4" />
            Add item
          </button>
          <div className="text-sm font-bold text-gray-900">
            Total: {fmt(total)}
          </div>
        </div>
      </div>

      {/* Auto follow-up (invoice only) */}
      {type === "invoice" && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-700">Auto follow-up</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {isPro
                  ? "Sends reminder emails at 3 days before, on the due date, and every 3 days after until paid"
                  : "Upgrade to Pro to enable auto follow-ups"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoFollowUp}
              disabled={!isPro}
              onClick={() => setAutoFollowUp(!autoFollowUp)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-40 ${
                autoFollowUp ? "bg-emerald-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoFollowUp ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </label>
        </div>
      )}

      {/* Recurring invoice (invoice only) */}
      {type === "invoice" && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-700">Recurring invoice</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Automatically create a new invoice on a repeating schedule
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isRecurring}
              onClick={() => setIsRecurring(!isRecurring)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isRecurring ? "bg-emerald-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isRecurring ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </label>
          {isRecurring && (
            <div className="flex gap-2 pt-1">
              {(["weekly", "monthly", "quarterly"] as const).map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => setRecurringFrequency(freq)}
                  className={`flex-1 text-xs font-medium py-2 rounded-lg border transition-colors capitalize ${
                    recurringFrequency === freq
                      ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {freq}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-3 pb-6">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
        >
          {submitting
            ? (editMode ? "Saving…" : "Creating…")
            : editMode
            ? "Save changes"
            : type === "invoice"
            ? "Create invoice"
            : "Create quote"}
        </button>
      </div>
    </form>
    </>
  )
}
