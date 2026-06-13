"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import Link from "next/link"

const DEFAULT_PROMPT =
  "Logo design for a fintech startup — 3 concept variations, revision round included. $1,500 total. 2-week delivery."

export function DemoWidget() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [output, setOutput] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    if (!prompt.trim() || loading) return
    setLoading(true)
    setError(null)
    setOutput(null)
    setVisible(false)

    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })
      const data: { proposal?: string; error?: string } = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Something went wrong")
      } else {
        setOutput(data.proposal ?? "")
        // Brief delay so the element mounts before opacity transition fires
        setTimeout(() => setVisible(true), 50)
      }
    } catch {
      setError("Something went wrong — please try again")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-12">
      {/* Input card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          What&apos;s the project?
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          maxLength={500}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none bg-slate-50"
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="mt-4 w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating...
            </>
          ) : (
            "Generate proposal →"
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Output card — mounts then fades in to trigger CSS transition */}
      {output !== null && (
        <div
          className={`mt-4 bg-white rounded-2xl border border-emerald-200 shadow-md p-6 transition-all duration-500 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-semibold text-emerald-600">✦ BillingBee AI</span>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-emerald-500">Ready to send</span>
            </div>
          </div>
          <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
            {output}
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex gap-3 flex-wrap">
            <Link
              href="/register"
              className="bg-emerald-500 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-emerald-600 transition-colors"
            >
              Send to client →
            </Link>
            <Link
              href="/register"
              className="bg-slate-100 text-slate-700 text-sm px-4 py-2 rounded-lg font-medium hover:bg-slate-200 transition-colors"
            >
              Create account to save
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
