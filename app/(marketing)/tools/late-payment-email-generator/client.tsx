"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import FaqSection from "../_components/FaqSection"
import { ArrowLeft, ArrowRight, Loader2, Copy, Check } from "lucide-react"

const TONES = ["Friendly", "Firm", "Final Notice"]

function PillSelector({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            value === opt
              ? "bg-emerald-500 text-white border-emerald-500"
              : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  )
}

export default function LatePaymentEmailGeneratorClient() {
  const [form, setForm] = useState({
    clientName: "",
    yourName: "",
    invoiceNumber: "",
    amount: "",
    daysOverdue: "",
    tone: "Friendly",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ subject: string; body: string } | null>(null)

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/tools/late-payment-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          daysOverdue: Number(form.daysOverdue),
        }),
      })
      const data = await res.json()
      if (res.status === 429) {
        setError("rate_limited")
        return
      }
      if (!res.ok || data.error) {
        setError(data.error ?? "Something went wrong. Please try again.")
        return
      }
      setResult(data)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="BillingBee" width={140} height={28} className="brightness-0" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Sign in
            </Link>
            <Link
              href="/register"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-95"
            >
              Try free →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/tools" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6">
          <ArrowLeft className="w-4 h-4" />
          All tools
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">✉️</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              AI-Powered
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Late Payment Email Generator</h1>
          <p className="text-slate-500">Generate professional payment reminder emails instantly. Pick your tone and let AI write it.</p>
        </div>

        {!result ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Client Name *</label>
                <input
                  type="text"
                  value={form.clientName}
                  onChange={(e) => set("clientName", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Your Name *</label>
                <input
                  type="text"
                  value={form.yourName}
                  onChange={(e) => set("yourName", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="Priya Sharma"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Invoice Number *</label>
                <input
                  type="text"
                  value={form.invoiceNumber}
                  onChange={(e) => set("invoiceNumber", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="INV-0042"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Invoice Amount *</label>
                <input
                  type="text"
                  value={form.amount}
                  onChange={(e) => set("amount", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="₹25,000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Days Overdue *</label>
                <input
                  type="number"
                  value={form.daysOverdue}
                  onChange={(e) => set("daysOverdue", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="14"
                  min={1}
                />
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">Tone</label>
              <PillSelector options={TONES} value={form.tone} onChange={(v) => set("tone", v)} />
            </div>

            {error === "rate_limited" && (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-4">
                You&apos;ve used this tool too many times. Try again in an hour.
              </p>
            )}
            {error && error !== "rate_limited" && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-4">{error}</p>
            )}

            <button
              onClick={generate}
              disabled={
                loading ||
                !form.clientName ||
                !form.yourName ||
                !form.invoiceNumber ||
                !form.amount ||
                !form.daysOverdue
              }
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating email...
                </>
              ) : (
                "Generate Email"
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject</span>
                <CopyButton text={result.subject} />
              </div>
              <p className="text-slate-900 font-medium">{result.subject}</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Body</span>
                <CopyButton text={result.body} />
              </div>
              <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed">{result.body}</pre>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <p className="text-sm text-emerald-800">
                Never chase payments manually again —{" "}
                <Link href="/register" className="font-semibold underline hover:text-emerald-900">
                  BillingBee sends reminders automatically →
                </Link>
              </p>
            </div>

            <button
              onClick={() => {
                setResult(null)
                setError(null)
              }}
              className="w-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium py-3 rounded-lg transition-colors"
            >
              Generate Another
            </button>
          </div>
        )}

        <div className="mt-10 bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Automate your payment reminders</h2>
          <p className="text-sm text-slate-500 mb-4">
            BillingBee sends payment reminders automatically so you never have to write these emails again.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
          >
            Create your free account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <FaqSection
          toolName="Late Payment Email Generator"
          faqs={[
            {
              question: "How do I ask for payment without being rude?",
              answer: "Be direct but professional. Stating the invoice number, amount, and due date clearly is better than vague hints. Clients respect directness — apologetic language actually makes them take you less seriously. State the fact, state the due date, state what you need them to do.",
            },
            {
              question: "How many reminder emails should I send before escalating?",
              answer: "Three emails: day 1 (polite reminder), day 7 (firm reminder with late fee notice), day 21 (final notice before formal action). After three ignored emails, phone calls and formal legal notices are more effective than more emails. Each email should be shorter and more direct than the last.",
            },
            {
              question: "What should a late payment reminder email include?",
              answer: "Invoice number, original amount, due date, days overdue, any late fees now applicable, and a clear call to action with payment instructions. Attach the original invoice again — the most common excuse is never receiving it, and attaching it removes that option entirely.",
            },
            {
              question: "Is it okay to CC someone else on a payment reminder?",
              answer: "Yes, after the first reminder goes unanswered. CC the client's accounts payable team, finance manager, or the person who hired you. This often resolves payment faster than escalating with the original contact alone. Do it professionally, not aggressively.",
            },
            {
              question: "What if my client says they will pay next week — repeatedly?",
              answer: "Get a specific date in writing via email — asking them to confirm the exact payment date creates accountability. If the promised date passes, your follow-up references their own commitment. Three broken promises means stop work on any ongoing projects until payment clears.",
            },
            {
              question: "Can BillingBee send payment reminder emails automatically?",
              answer: "Yes — BillingBee Pro sends automatic payment reminders at intervals you set, follows up until the invoice is paid, and logs every client communication. No more chasing payments manually. Free to start at billingbee.co.",
            },
          ]}
        />
      </main>
    </div>
  )
}
