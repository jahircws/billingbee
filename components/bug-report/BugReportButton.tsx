"use client"

import { useState } from "react"
import { Bug, X, ChevronDown } from "lucide-react"
import { logIssue } from "@/app/actions/issue-report"

const SEVERITY_OPTIONS = ["Low", "Medium", "High", "Critical"] as const

export default function BugReportButton() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [severity, setSeverity] = useState<typeof SEVERITY_OPTIONS[number]>("Medium")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const url = typeof window !== "undefined" ? window.location.pathname : ""

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    await logIssue({
      type: "MANUAL",
      title: title.trim(),
      description: description.trim() || undefined,
      url,
      metadata: { severity },
    })
    setSubmitting(false)
    setDone(true)
    setTimeout(() => {
      setDone(false)
      setOpen(false)
      setTitle("")
      setDescription("")
      setSeverity("Medium")
    }, 2000)
  }

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 z-40">
      {open && (
        <div className="absolute bottom-14 right-0 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4 text-red-500" />
              <span className="text-sm font-semibold text-gray-800">Report a bug</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {done ? (
            <div className="p-6 text-center space-y-2">
              <p className="text-2xl">✅</p>
              <p className="text-sm font-medium text-gray-800">Thanks! We logged it.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">What went wrong? *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Invoice PDF shows wrong currency"
                  required
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Steps to reproduce (optional)</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  placeholder="What were you doing when it happened?"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Severity</label>
                <div className="relative">
                  <select
                    value={severity}
                    onChange={e => setSeverity(e.target.value as typeof severity)}
                    className="w-full appearance-none text-sm border border-gray-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
                  >
                    {SEVERITY_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 font-mono truncate">
                📍 {url}
              </div>

              <button
                type="submit"
                disabled={submitting || !title.trim()}
                className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
              >
                {submitting ? "Sending…" : "Submit report"}
              </button>
            </form>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
        title="Report a bug"
      >
        <Bug className="w-4 h-4" />
      </button>
    </div>
  )
}
