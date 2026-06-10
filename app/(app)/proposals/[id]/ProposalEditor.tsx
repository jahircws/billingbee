"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  Send, Download, Edit2, Save, X, Plus, Trash2,
  FileText, FileDown, ChevronDown
} from "lucide-react"
import { updateProposal, sendProposalToClient } from "@/app/actions/proposal"

interface Section { title: string; content: string }
interface Pricing { description?: string; total?: number; currency?: string }

interface Proposal {
  id: string
  title: string
  status: string
  sections: Section[]
  pricing: Pricing | null
  timeline: string | null
  createdAt: Date
  client: { name: string; email: string | null }
  contract: { id: string } | null
}

const statusColor: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SENT: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
}

const statusLabel: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent — awaiting client response",
  ACCEPTED: "Accepted by client",
  REJECTED: "Declined by client",
}

function formatAmount(total: number, currency?: string) {
  const sym = !currency || currency === "INR" ? "₹"
    : currency === "USD" ? "$"
    : currency === "EUR" ? "€"
    : currency === "GBP" ? "£"
    : currency + " "
  const locale = (!currency || currency === "INR") ? "en-IN" : "en-US"
  return `${sym}${total.toLocaleString(locale)}`
}

export default function ProposalEditor({ proposal }: { proposal: Proposal }) {
  const router = useRouter()
  const printRef = useRef<HTMLDivElement>(null)

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)

  // Editable state
  const [title, setTitle] = useState(proposal.title)
  const [timeline, setTimeline] = useState(proposal.timeline ?? "")
  const [sections, setSections] = useState<Section[]>(proposal.sections)
  const [pricing, setPricing] = useState<Pricing>(proposal.pricing ?? {})

  const canSend = proposal.status === "DRAFT"
  const canEdit = proposal.status === "DRAFT"

  function discardEdits() {
    setTitle(proposal.title)
    setTimeline(proposal.timeline ?? "")
    setSections(proposal.sections)
    setPricing(proposal.pricing ?? {})
    setEditing(false)
    setError("")
  }

  async function saveDraft() {
    setSaving(true)
    setError("")
    try {
      const result = await updateProposal(proposal.id, {
        title,
        timeline: timeline || undefined,
        sections,
        pricing: pricing.total !== undefined ? pricing : undefined,
      })
      if ("error" in result) { setError((result as { error?: string }).error ?? "Failed to save"); return }
      setEditing(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  async function handleSend() {
    if (!proposal.client.email) {
      setError("Client has no email address. Add one in Clients first.")
      return
    }
    if (!confirm(`Send this proposal to ${proposal.client.email}?`)) return
    setSending(true)
    setError("")
    try {
      const result = await sendProposalToClient(proposal.id)
      if ("error" in result) { setError(result.error ?? "Failed to send"); return }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send")
    } finally {
      setSending(false)
    }
  }

  function downloadAsText() {
    const lines: string[] = [
      title,
      "=".repeat(title.length),
      "",
      `Client: ${proposal.client.name}`,
      timeline ? `Timeline: ${timeline}` : "",
      `Date: ${format(new Date(proposal.createdAt), "d MMMM yyyy")}`,
      "",
    ]
    for (const s of sections) {
      lines.push(s.title)
      lines.push("-".repeat(s.title.length))
      lines.push(s.content)
      lines.push("")
    }
    if (pricing?.total !== undefined && pricing.total > 0) {
      lines.push("Investment")
      lines.push("---------")
      if (pricing.description) lines.push(pricing.description)
      lines.push(formatAmount(Number(pricing.total), pricing.currency))
    }
    const blob = new Blob([lines.filter(l => l !== undefined).join("\n")], { type: "text/plain" })
    triggerDownload(blob, `${title}.txt`)
  }

  function downloadAsMarkdown() {
    const lines: string[] = [
      `# ${title}`,
      "",
      `**Client:** ${proposal.client.name}`,
      timeline ? `**Timeline:** ${timeline}` : "",
      `**Date:** ${format(new Date(proposal.createdAt), "d MMMM yyyy")}`,
      "",
    ]
    for (const s of sections) {
      lines.push(`## ${s.title}`)
      lines.push("")
      lines.push(s.content)
      lines.push("")
    }
    if (pricing?.total !== undefined && pricing.total > 0) {
      lines.push("## Investment")
      lines.push("")
      if (pricing.description) lines.push(pricing.description)
      lines.push(`**${formatAmount(Number(pricing.total), pricing.currency)}**`)
    }
    const blob = new Blob([lines.filter(l => l !== undefined).join("\n")], { type: "text/markdown" })
    triggerDownload(blob, `${title}.md`)
  }

  function downloadAsPDF() {
    // Open a print-friendly page in a new window
    const content = buildPrintHTML()
    const w = window.open("", "_blank")
    if (!w) return
    w.document.write(content)
    w.document.close()
    w.focus()
    setTimeout(() => { w.print() }, 400)
  }

  function buildPrintHTML() {
    const sectionHTML = sections.map(s => `
      <div class="section">
        <h3>${escHtml(s.title)}</h3>
        <p>${escHtml(s.content).replace(/\n/g, "<br>")}</p>
      </div>`).join("")

    const pricingHTML = (pricing?.total !== undefined && pricing.total > 0) ? `
      <div class="pricing">
        <h3>Investment</h3>
        ${pricing.description ? `<p>${escHtml(pricing.description)}</p>` : ""}
        <p class="amount">${formatAmount(Number(pricing.total), pricing.currency)}</p>
      </div>` : ""

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${escHtml(title)}</title>
<style>
  body { font-family: Georgia, serif; max-width: 720px; margin: 40px auto; color: #111; line-height: 1.6; padding: 0 20px; }
  h1 { font-size: 26px; margin-bottom: 4px; }
  .meta { color: #666; font-size: 14px; margin-bottom: 32px; }
  .section { margin-bottom: 28px; }
  h3 { font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #333; border-bottom: 1px solid #eee; padding-bottom: 4px; margin-bottom: 8px; }
  p { font-size: 14px; margin: 0; }
  .pricing { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-top: 28px; }
  .amount { font-size: 28px; font-weight: 800; color: #15803d; margin-top: 8px !important; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
<h1>${escHtml(title)}</h1>
<div class="meta">
  For ${escHtml(proposal.client.name)}${timeline ? ` &nbsp;·&nbsp; Timeline: ${escHtml(timeline)}` : ""} &nbsp;·&nbsp; ${format(new Date(proposal.createdAt), "d MMMM yyyy")}
</div>
${sectionHTML}
${pricingHTML}
</body>
</html>`
  }

  function escHtml(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
  }

  function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  function updateSection(i: number, field: "title" | "content", value: string) {
    setSections(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  function addSection() {
    setSections(prev => [...prev, { title: "New Section", content: "" }])
  }

  function removeSection(i: number) {
    setSections(prev => prev.filter((_, idx) => idx !== i))
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 pb-20 md:pb-6" ref={printRef}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="text-xl font-bold text-gray-900 border-b-2 border-blue-400 bg-transparent w-full outline-none pb-0.5"
            />
          ) : (
            <h2 className="text-xl font-bold text-gray-900 truncate">{title}</h2>
          )}
          <p className="text-sm text-gray-500">{proposal.client.name}</p>
          {(timeline || editing) && (
            editing ? (
              <input
                value={timeline}
                onChange={e => setTimeline(e.target.value)}
                placeholder="e.g. 4 weeks"
                className="text-xs text-gray-500 border-b border-gray-300 bg-transparent outline-none mt-0.5 w-40"
              />
            ) : (
              <p className="text-xs text-gray-400 mt-0.5">Timeline: {timeline}</p>
            )
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[proposal.status] ?? "bg-gray-100 text-gray-600"}`}>
            {statusLabel[proposal.status] ?? proposal.status}
          </span>

          {/* Edit / Save / Discard */}
          {canEdit && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-sm border border-gray-200 hover:border-gray-300 text-gray-700 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
          )}
          {editing && (
            <>
              <button
                onClick={saveDraft}
                disabled={saving}
                className="flex items-center gap-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3 py-1.5 rounded-lg disabled:opacity-60 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? "Saving…" : "Save draft"}
              </button>
              <button
                onClick={discardEdits}
                className="flex items-center gap-1.5 text-sm border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Discard
              </button>
            </>
          )}

          {/* Download */}
          <div className="relative">
            <button
              onClick={() => setShowDownloadMenu(v => !v)}
              className="flex items-center gap-1.5 text-sm border border-gray-200 hover:border-gray-300 text-gray-700 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download <ChevronDown className="w-3 h-3" />
            </button>
            {showDownloadMenu && (
              <div
                className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[160px] py-1"
                onMouseLeave={() => setShowDownloadMenu(false)}
              >
                <button
                  onClick={() => { downloadAsPDF(); setShowDownloadMenu(false) }}
                  className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <FileDown className="w-4 h-4 text-red-500" /> PDF
                </button>
                <button
                  onClick={() => { downloadAsMarkdown(); setShowDownloadMenu(false) }}
                  className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="w-4 h-4 text-blue-500" /> Markdown
                </button>
                <button
                  onClick={() => { downloadAsText(); setShowDownloadMenu(false) }}
                  className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="w-4 h-4 text-gray-400" /> Plain text
                </button>
              </div>
            )}
          </div>

          {/* Send to client */}
          {canSend && (
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-lg disabled:opacity-60 transition-colors"
            >
              <Send className="w-4 h-4" />
              {sending ? "Sending…" : "Send to client"}
            </button>
          )}

          {/* Contract link */}
          {proposal.contract && (
            <a
              href={`/contracts/${proposal.contract.id}`}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
            >
              View contract →
            </a>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Status banners */}
      {proposal.status === "SENT" && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
          Proposal sent to <strong>{proposal.client.name}</strong> — waiting for their response.
        </div>
      )}
      {proposal.status === "ACCEPTED" && !proposal.contract && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800">
          🎉 <strong>{proposal.client.name}</strong> accepted this proposal.
        </div>
      )}
      {proposal.status === "REJECTED" && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
          <strong>{proposal.client.name}</strong> declined this proposal.
        </div>
      )}

      {/* Sections */}
      {sections.map((section, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
          {editing ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  value={section.title}
                  onChange={e => updateSection(i, "title", e.target.value)}
                  className="flex-1 text-sm font-semibold text-gray-800 border-b border-gray-200 bg-transparent outline-none pb-0.5"
                />
                <button onClick={() => removeSection(i)} className="text-gray-300 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <textarea
                value={section.content}
                onChange={e => updateSection(i, "content", e.target.value)}
                rows={5}
                className="w-full text-sm text-gray-600 border border-gray-200 rounded-lg p-2 outline-none focus:border-blue-300 resize-y"
              />
            </div>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">{section.title}</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{section.content}</p>
            </>
          )}
        </div>
      ))}

      {/* Add section button */}
      {editing && (
        <button
          onClick={addSection}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium border border-dashed border-blue-200 rounded-xl px-4 py-3 w-full hover:bg-blue-50/50 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add section
        </button>
      )}

      {/* Pricing */}
      <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Investment</h3>
        {editing ? (
          <div className="space-y-2">
            <input
              value={pricing.description ?? ""}
              onChange={e => setPricing(p => ({ ...p, description: e.target.value }))}
              placeholder="Description (optional)"
              className="w-full text-sm text-gray-600 border border-emerald-200 rounded-lg p-2 outline-none focus:border-emerald-400 bg-white"
            />
            <div className="flex gap-2">
              <select
                value={pricing.currency ?? "INR"}
                onChange={e => setPricing(p => ({ ...p, currency: e.target.value }))}
                className="text-sm border border-emerald-200 rounded-lg px-2 py-1.5 bg-white outline-none focus:border-emerald-400"
              >
                <option value="INR">₹ INR</option>
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
                <option value="GBP">£ GBP</option>
              </select>
              <input
                type="number"
                value={pricing.total ?? ""}
                onChange={e => setPricing(p => ({ ...p, total: e.target.value ? Number(e.target.value) : undefined }))}
                placeholder="Total amount"
                className="flex-1 text-sm border border-emerald-200 rounded-lg px-2 py-1.5 bg-white outline-none focus:border-emerald-400"
              />
            </div>
          </div>
        ) : (
          <>
            {pricing?.description && (
              <p className="text-sm text-gray-600 mb-3">{pricing.description}</p>
            )}
            {pricing?.total !== undefined && pricing.total > 0 && (
              <p className="text-2xl font-black text-emerald-700">
                {formatAmount(Number(pricing.total), pricing.currency)}
              </p>
            )}
            {(!pricing?.total || pricing.total === 0) && (
              <p className="text-sm text-gray-400 italic">No pricing set</p>
            )}
          </>
        )}
      </div>

      <p className="text-xs text-gray-400">Created {format(new Date(proposal.createdAt), "d MMMM yyyy")}</p>
    </div>
  )
}
