"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format, addDays } from "date-fns"
import { Sparkles, X, Plus, ChevronDown, ChevronUp, Loader2, Paperclip, ArrowRight } from "lucide-react"
import UploadToInvoice, { type ExtractionResult } from "@/components/ai/UploadToInvoice"

// ── Types ────────────────────────────────────────────────────────────────────

type DocType = "invoice" | "quote" | "proposal" | "contract"

interface LineItem {
  id: string
  description: string
  qty: number
  rate: number
}

interface FormState {
  docType: DocType
  docNumber: string
  fromName: string
  fromEmail: string
  toName: string
  toEmail: string
  toCompany: string
  issueDate: string
  dueDate: string
  projectTitle: string
  timeline: string
  scopeSummary: string
  items: LineItem[]
  taxEnabled: boolean
  taxName: string
  taxRate: string
  notesEnabled: boolean
  notes: string
  paymentTerms: string
}

const today = format(new Date(), "yyyy-MM-dd")
const plus14 = format(addDays(new Date(), 14), "yyyy-MM-dd")
const plus30 = format(addDays(new Date(), 30), "yyyy-MM-dd")

function newItem(): LineItem {
  return { id: crypto.randomUUID(), description: "", qty: 1, rate: 0 }
}

function defaultState(docType: DocType = "invoice"): FormState {
  return {
    docType,
    docNumber: docType === "invoice" ? "INV-001" : docType === "quote" ? "QUO-001" : "DOC-001",
    fromName: "",
    fromEmail: "",
    toName: "",
    toEmail: "",
    toCompany: "",
    issueDate: today,
    dueDate: docType === "quote" ? plus14 : plus30,
    projectTitle: "",
    timeline: "",
    scopeSummary: "",
    items: [newItem()],
    taxEnabled: false,
    taxName: "GST",
    taxRate: "18",
    notesEnabled: false,
    notes: "",
    paymentTerms: "",
  }
}

// ── Preview component (pure, no side-effects) ────────────────────────────────

function Preview({ form }: { form: FormState }) {
  const subtotal = form.items.reduce((s, i) => s + i.qty * i.rate, 0)
  const taxRate = form.taxEnabled ? parseFloat(form.taxRate) || 0 : 0
  const taxAmt = subtotal * (taxRate / 100)
  const total = subtotal + taxAmt
  const fmt = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2 })
  const docLabel = form.docType.charAt(0).toUpperCase() + form.docType.slice(1)

  return (
    <div className="bg-white rounded-lg shadow-xl border border-gray-100 p-10 text-sm font-mono min-h-[700px] relative">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="text-lg font-bold text-gray-900">{form.fromName || "Your Business"}</div>
          {form.fromEmail && <div className="text-gray-500 text-xs mt-0.5">{form.fromEmail}</div>}
        </div>
        <div className="text-right">
          <div className="text-base font-bold text-emerald-600">{docLabel}</div>
          <div className="text-gray-400 text-xs mt-0.5">#{form.docNumber}</div>
        </div>
      </div>

      {/* Bill to + dates */}
      <div className="flex justify-between mb-6">
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Bill To</div>
          <div className="font-semibold text-gray-900">{form.toName || "Client Name"}</div>
          {form.toCompany && <div className="text-gray-500 text-xs">{form.toCompany}</div>}
          {form.toEmail && <div className="text-gray-500 text-xs">{form.toEmail}</div>}
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Issue Date</div>
          <div className="text-gray-700">{form.issueDate}</div>
          {form.dueDate && (
            <>
              <div className="text-xs text-gray-400 uppercase tracking-widest mt-2 mb-1">
                {form.docType === "quote" ? "Valid Until" : "Due Date"}
              </div>
              <div className="text-gray-700">{form.dueDate}</div>
            </>
          )}
        </div>
      </div>

      {/* Items table */}
      <table className="w-full mb-6 text-xs">
        <thead>
          <tr className="border-y border-gray-100 bg-gray-50">
            <th className="py-2 px-2 text-left text-gray-400 font-normal">Description</th>
            <th className="py-2 px-2 text-center text-gray-400 font-normal">Qty</th>
            <th className="py-2 px-2 text-right text-gray-400 font-normal">Rate</th>
            <th className="py-2 px-2 text-right text-gray-400 font-normal">Amount</th>
          </tr>
        </thead>
        <tbody>
          {form.items.map((item) => (
            <tr key={item.id} className="border-b border-gray-50">
              <td className="py-2 px-2 text-gray-800">{item.description || <span className="text-gray-300">—</span>}</td>
              <td className="py-2 px-2 text-center text-gray-600">{item.qty}</td>
              <td className="py-2 px-2 text-right text-gray-600">{fmt(item.rate)}</td>
              <td className="py-2 px-2 text-right text-gray-800">{fmt(item.qty * item.rate)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-6">
        <div className="w-48 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">Subtotal</span>
            <span className="text-gray-700">{fmt(subtotal)}</span>
          </div>
          {form.taxEnabled && taxRate > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-400">{form.taxName} ({form.taxRate}%)</span>
              <span className="text-gray-700">{fmt(taxAmt)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
            <span className="font-bold text-gray-900">Total</span>
            <span className="font-bold text-emerald-600">{fmt(total)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {form.notes && (
        <div className="mb-4">
          <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Notes</div>
          <div className="text-xs text-gray-600 whitespace-pre-wrap">{form.notes}</div>
        </div>
      )}
      {form.paymentTerms && (
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Payment Terms</div>
          <div className="text-xs text-gray-600">{form.paymentTerms}</div>
        </div>
      )}

      {/* Watermark */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <span className="text-xs text-gray-300">Created with BillingBee — billingbee.co</span>
      </div>
    </div>
  )
}

// ── Sign-up interstitial for Proposal / Contract ─────────────────────────────

function SignUpInterstitial({ docType }: { docType: "proposal" | "contract" }) {
  const label = docType === "proposal" ? "Proposals" : "Contracts"
  const description =
    docType === "proposal"
      ? "Multi-section AI proposals with scope, deliverables, timeline, and pricing — auto-generated from a brief."
      : "Professional contracts with custom clauses, e-signature, and client acceptance flow."

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-sm text-center">
        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Sparkles size={24} className="text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{label} need an account</h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">{description}</p>
        <Link
          href="/register?from=generate"
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors w-full"
        >
          Sign up free to get started
          <ArrowRight size={14} />
        </Link>
        <p className="text-xs text-gray-400 mt-3">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

// ── Main client component ─────────────────────────────────────────────────────

export default function GenerateClient() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(defaultState)
  const [urlTypeLocked, setUrlTypeLocked] = useState(false)
  const [showTax, setShowTax] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [showDraftBanner, setShowDraftBanner] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [suggestLoading, setSuggestLoading] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<Record<string, string[]>>({})
  const [mobilePreview, setMobilePreview] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

  const previewDebounce = useRef<NodeJS.Timeout | null>(null)
  const [previewForm, setPreviewForm] = useState<FormState>(form)

  // Read URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const type = (params.get("type") as DocType) || "invoice"
    const template = params.get("template") || ""
    const from = params.get("from") || ""

    if (type !== "invoice") setUrlTypeLocked(true)

    // Acquisition tracking
    const utmSource = params.get("utm_source") || (from ? "seo" : "")
    const utmCampaign = params.get("utm_campaign") || from || ""
    if (utmSource || utmCampaign || from) {
      try {
        localStorage.setItem("bb_acquisition", JSON.stringify({
          source: utmSource || from || "direct",
          campaign: utmCampaign,
          from,
          landedAt: new Date().toISOString(),
        }))
      } catch { /* ignore */ }
    }

    // Check for draft
    try {
      const raw = localStorage.getItem("bb_draft")
      if (raw) {
        const draft = JSON.parse(raw)
        const age = Date.now() - new Date(draft.createdAt).getTime()
        if (age < 24 * 60 * 60 * 1000) {
          setShowDraftBanner(true)
          return
        }
      }
    } catch { /* ignore */ }

    setForm(defaultState(type))

    // Remember previous from/email
    try {
      const remembered = localStorage.getItem("bb_me")
      if (remembered) {
        const { fromName, fromEmail } = JSON.parse(remembered)
        setForm((f) => ({ ...f, fromName: fromName || f.fromName, fromEmail: fromEmail || f.fromEmail }))
      }
    } catch { /* ignore */ }

    void template
  }, [])

  // Debounce preview updates
  useEffect(() => {
    if (previewDebounce.current) clearTimeout(previewDebounce.current)
    previewDebounce.current = setTimeout(() => setPreviewForm(form), 300)
    return () => { if (previewDebounce.current) clearTimeout(previewDebounce.current) }
  }, [form])

  // Persist draft
  useEffect(() => {
    const draft = {
      type: form.docType,
      fromName: form.fromName,
      fromEmail: form.fromEmail,
      toName: form.toName,
      items: form.items,
      notes: form.notes,
      tax: { name: form.taxName, rate: form.taxRate },
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem("bb_draft", JSON.stringify(draft))
  }, [form])

  function loadDraft() {
    try {
      const raw = localStorage.getItem("bb_draft")
      if (!raw) return
      const d = JSON.parse(raw)
      setForm((f) => ({
        ...f,
        docType: d.type || f.docType,
        fromName: d.fromName || f.fromName,
        fromEmail: d.fromEmail || f.fromEmail,
        toName: d.toName || f.toName,
        items: d.items?.length ? d.items : f.items,
        notes: d.notes || f.notes,
      }))
    } catch { /* ignore */ }
    setShowDraftBanner(false)
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function setItem(id: string, key: keyof LineItem, value: string | number) {
    setForm((f) => ({
      ...f,
      items: f.items.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    }))
  }

  function addItem() {
    setForm((f) => ({ ...f, items: [...f.items, newItem()] }))
  }

  function removeItem(id: string) {
    setForm((f) => ({ ...f, items: f.items.filter((i) => i.id !== id) }))
  }

  async function handleSuggest(itemId: string) {
    setSuggestLoading(itemId)
    try {
      const res = await fetch("/api/generate/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: form.docType,
          profession: "",
          existingItems: form.items.map((i) => i.description),
        }),
      })
      const data = await res.json()
      if (data.suggestions) {
        setSuggestions((s) => ({ ...s, [itemId]: data.suggestions }))
      }
    } catch { /* ignore */ }
    setSuggestLoading(null)
  }

  function applySuggestion(itemId: string, suggestion: string) {
    setItem(itemId, "description", suggestion)
    setSuggestions((s) => { const n = { ...s }; delete n[itemId]; return n })
  }

  async function handleAIGenerate() {
    if (!form.fromName || !form.toName) return
    setAiLoading(true)
    try {
      const res = await fetch("/api/generate/document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: form.docType,
          fromName: form.fromName,
          toName: form.toName,
          items: form.items,
          profession: "",
          template: "",
        }),
      })
      const data = await res.json()
      if (data.items) {
        setForm((f) => ({
          ...f,
          items: data.items.map((item: { description: string; qty: number; rate: number }) => ({ ...item, id: crypto.randomUUID() })),
          notes: data.notes || f.notes,
          paymentTerms: data.paymentTerms || f.paymentTerms,
        }))
      }
    } catch { /* ignore */ }
    setAiLoading(false)

    // Remember from details
    localStorage.setItem("bb_me", JSON.stringify({ fromName: form.fromName, fromEmail: form.fromEmail }))
  }

  function handleExtracted(data: ExtractionResult) {
    setForm((f) => ({
      ...f,
      toName: data.clientName ?? f.toName,
      toEmail: data.clientEmail ?? f.toEmail,
      toCompany: data.clientCompany ?? f.toCompany,
      items: data.items.length
        ? data.items.map((i) => ({ ...i, id: crypto.randomUUID() }))
        : f.items,
      notes: data.notes ?? f.notes,
      dueDate: data.dueDate ?? f.dueDate,
    }))
    setShowUpload(false)
  }

  async function handleDownloadPDF() {
    setPdfLoading(true)
    try {
      const res = await fetch("/api/generate/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentData: {
            documentType: form.docType,
            docNumber: form.docNumber,
            fromName: form.fromName,
            fromEmail: form.fromEmail,
            toName: form.toName,
            toEmail: form.toEmail,
            toCompany: form.toCompany,
            issueDate: form.issueDate,
            dueDate: form.dueDate,
            items: form.items.map((i) => ({ description: i.description, qty: i.qty, rate: i.rate })),
            taxName: form.taxEnabled ? form.taxName : undefined,
            taxRate: form.taxEnabled ? parseFloat(form.taxRate) : undefined,
            notes: form.notes,
            paymentTerms: form.paymentTerms,
          },
        }),
      })
      if (!res.ok) throw new Error("PDF generation failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${form.docType}-${form.docNumber}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch { /* ignore */ }
    setPdfLoading(false)
  }

  function handleSaveAndRegister() {
    try {
      localStorage.setItem("bb_pending_doc", JSON.stringify(form))
    } catch { /* ignore */ }
    router.push("/register?from=generate")
  }

  const docTypes: { id: DocType; label: string }[] = [
    { id: "invoice", label: "Invoice" },
    { id: "quote", label: "Quote" },
    { id: "proposal", label: "Proposal" },
    { id: "contract", label: "Contract" },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Topbar */}
      <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
        <Link href="/" className="font-bold text-gray-900 text-lg tracking-tight">
          <span className="text-emerald-600">Billing</span>Bee
        </Link>
        <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
          Sign in
        </Link>
      </header>

      {/* Draft banner */}
      {showDraftBanner && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between text-sm">
          <span className="text-amber-800">You have an unsaved draft. Continue where you left off?</span>
          <div className="flex gap-3">
            <button onClick={loadDraft} className="text-emerald-700 font-semibold hover:underline">
              Continue draft
            </button>
            <button onClick={() => setShowDraftBanner(false)} className="text-gray-500 hover:text-gray-700">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Proposal / Contract interstitial — replaces entire content area */}
        {(form.docType === "proposal" || form.docType === "contract") && (
          <div className="flex flex-1 flex-col">
            {/* Still show the tab switcher so they can go back */}
            <div className="w-full md:w-[480px] shrink-0 bg-white border-r border-gray-100 px-6 pt-6">
              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                {docTypes.map((dt) => (
                  <button
                    key={dt.id}
                    onClick={() => set("docType", dt.id)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                      form.docType === dt.id
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {dt.label}
                  </button>
                ))}
              </div>
            </div>
            <SignUpInterstitial docType={form.docType} />
          </div>
        )}

        {/* Left column + right column — invoice and quote only */}
        {(form.docType === "invoice" || form.docType === "quote") && (
        <>
        <div className="w-full md:w-[480px] shrink-0 overflow-y-auto bg-white border-r border-gray-100">
          <div className="p-6 space-y-6">
            {/* Doc type tabs (hide if type in URL) */}
            {!urlTypeLocked && (
              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                {docTypes.map((dt) => (
                  <button
                    key={dt.id}
                    onClick={() => set("docType", dt.id)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                      form.docType === dt.id
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {dt.label}
                  </button>
                ))}
              </div>
            )}

            {/* Your details */}
            <section suppressHydrationWarning>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Your details</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Business name *"
                  value={form.fromName}
                  onChange={(e) => set("fromName", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="email"
                  placeholder="Your email (optional)"
                  value={form.fromEmail}
                  onChange={(e) => set("fromEmail", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </section>

            {/* Bill to */}
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Bill to</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Client name *"
                  value={form.toName}
                  onChange={(e) => set("toName", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="email"
                  placeholder="Client email (optional)"
                  value={form.toEmail}
                  onChange={(e) => set("toEmail", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Company (optional)"
                  value={form.toCompany}
                  onChange={(e) => set("toCompany", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </section>

            {/* Line items */}
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Line items</h3>
              <div className="space-y-2">
                {/* Table header */}
                <div className="grid grid-cols-12 gap-1 text-xs text-gray-400 px-1">
                  <div className="col-span-6">Description</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-right">Rate</div>
                  <div className="col-span-2 text-right">Amount</div>
                </div>
                {form.items.map((item) => (
                  <div key={item.id} className="space-y-1">
                    <div className="grid grid-cols-12 gap-1 items-center">
                      <div className="col-span-6 relative">
                        <input
                          type="text"
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => setItem(item.id, "description", e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min={1}
                          value={item.qty}
                          onChange={(e) => setItem(item.id, "qty", parseFloat(e.target.value) || 1)}
                          className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min={0}
                          value={item.rate}
                          onChange={(e) => setItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                          className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-1">
                        <span className="text-sm text-gray-700 tabular-nums">
                          {(item.qty * item.rate).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                        {form.items.length > 1 && (
                          <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Suggest row */}
                    <div className="flex items-center gap-2 pl-1">
                      <button
                        onClick={() => handleSuggest(item.id)}
                        disabled={suggestLoading === item.id}
                        className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 disabled:opacity-50"
                      >
                        {suggestLoading === item.id ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                        Suggest
                      </button>
                      {suggestions[item.id]?.map((s) => (
                        <button
                          key={s}
                          onClick={() => applySuggestion(item.id, s)}
                          className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  onClick={addItem}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 transition-colors mt-1"
                >
                  <Plus size={14} />
                  Add row
                </button>
              </div>
            </section>

            {/* Document details */}
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Document details</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder={form.docType === "invoice" ? "Invoice number" : form.docType === "quote" ? "Quote number" : "Document number"}
                  value={form.docNumber}
                  onChange={(e) => set("docNumber", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Issue date</label>
                    <input
                      type="date"
                      value={form.issueDate}
                      onChange={(e) => set("issueDate", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">
                      {form.docType === "quote" ? "Valid until" : "Due date"}
                    </label>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => set("dueDate", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Tax toggle */}
            <section>
              <button
                onClick={() => setShowTax((v) => !v)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors w-full"
              >
                {showTax ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                <span>Tax</span>
                {form.taxEnabled && <span className="text-xs text-emerald-600 ml-auto">{form.taxName} {form.taxRate}%</span>}
              </button>
              {showTax && (
                <div className="mt-3 space-y-3">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={form.taxEnabled}
                      onChange={(e) => set("taxEnabled", e.target.checked)}
                      className="rounded"
                    />
                    Enable tax
                  </label>
                  {form.taxEnabled && (
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Tax name (e.g. GST)"
                        value={form.taxName}
                        onChange={(e) => set("taxName", e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <input
                        type="number"
                        placeholder="Rate %"
                        value={form.taxRate}
                        onChange={(e) => set("taxRate", e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}
                  <p className="text-xs text-gray-400">India hint: GST 18%</p>
                </div>
              )}
            </section>

            {/* Notes toggle */}
            <section>
              <button
                onClick={() => setShowNotes((v) => !v)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors w-full"
              >
                {showNotes ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                <span>Notes & payment terms</span>
              </button>
              {showNotes && (
                <div className="mt-3 space-y-3">
                  <textarea
                    placeholder="Notes (visible to client)"
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                  <input
                    type="text"
                    placeholder="Payment terms (e.g. Net 30)"
                    value={form.paymentTerms}
                    onChange={(e) => set("paymentTerms", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}
            </section>

            {/* AI Generate CTA */}
            <section className="space-y-3 pb-4">
              <button
                onClick={handleAIGenerate}
                disabled={aiLoading || !form.fromName || !form.toName}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
              >
                {aiLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                ✨ Generate with AI
              </button>
              <p className="text-center text-xs text-gray-400">Preview updates as you type</p>

              {/* Upload toggle */}
              <div>
                <button
                  onClick={() => setShowUpload((v) => !v)}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-emerald-700 mx-auto transition-colors"
                >
                  <Paperclip size={12} />
                  {showUpload ? "Close upload" : "Upload a doc instead"}
                </button>
                {showUpload && (
                  <div className="mt-4 border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <p className="text-xs text-gray-500 mb-3">
                      Drop a WhatsApp screenshot, email, PDF or text file — AI will fill the form for you.
                    </p>
                    <UploadToInvoice
                      endpoint="/api/generate/extract"
                      onExtracted={handleExtracted}
                    />
                  </div>
                )}
              </div>

              {/* Mobile preview toggle */}
              <button
                onClick={() => setMobilePreview((v) => !v)}
                className="md:hidden w-full border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm"
              >
                {mobilePreview ? "Hide preview" : "Show preview"}
              </button>
            </section>
          </div>
        </div>

        {/* Right column — preview */}
        <div className={`flex-1 flex flex-col overflow-hidden ${mobilePreview ? "flex" : "hidden md:flex"}`}>
          <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
            <div className="max-w-[700px] mx-auto">
              <Preview form={previewForm} />
            </div>
          </div>

          {/* Sticky CTA bar */}
          <div className="bg-emerald-600 px-6 py-4 shrink-0">
            <div className="max-w-[700px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-white font-semibold text-sm">
                  Sign up free to send with a payment link
                </p>
                <p className="text-emerald-200 text-xs mt-0.5">No credit card · 30 seconds to set up</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handleDownloadPDF}
                  disabled={pdfLoading}
                  className="bg-white/20 hover:bg-white/30 text-white font-semibold px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors"
                >
                  {pdfLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                  Download PDF
                </button>
                <button
                  onClick={handleSaveAndRegister}
                  className="bg-white text-emerald-700 font-semibold px-4 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                >
                  Save &amp; get paid
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  )
}
