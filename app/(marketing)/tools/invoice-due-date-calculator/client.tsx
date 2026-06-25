"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import FaqSection from "../_components/FaqSection"
import { ArrowLeft, ArrowRight, Calendar } from "lucide-react"

const NET_TERMS = [15, 30, 45, 60, 90] as const
type NetTerm = (typeof NET_TERMS)[number] | "custom"

function today(): string {
  return new Date().toISOString().split("T")[0]
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00")
  d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
}

function daysDiff(from: string, to: string): number {
  const a = new Date(from + "T00:00:00")
  const b = new Date(to + "T00:00:00")
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

function googleCalendarUrl(dueDate: string, invoiceDate: string, termDays: number): string {
  const title = encodeURIComponent(`Invoice Due (Net ${termDays})`)
  const dates = dueDate.replace(/-/g, "")
  const details = encodeURIComponent(`Invoice issued ${formatDisplayDate(invoiceDate)} — due today`)
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}/${dates}&details=${details}`
}

export default function InvoiceDueDateCalculatorClient() {
  const [invoiceDate, setInvoiceDate] = useState(today())
  const [selectedTerm, setSelectedTerm] = useState<NetTerm>(30)
  const [customDays, setCustomDays] = useState("45")

  const termDays = selectedTerm === "custom" ? (parseInt(customDays) || 0) : selectedTerm
  const dueDate = termDays > 0 && invoiceDate ? addDays(invoiceDate, termDays) : null
  const todayStr = today()
  const daysFromToday = dueDate ? daysDiff(todayStr, dueDate) : null

  let statusLabel = ""
  let statusClass = ""
  if (daysFromToday !== null) {
    if (daysFromToday > 0) {
      statusLabel = `Due in ${daysFromToday} day${daysFromToday === 1 ? "" : "s"}`
      statusClass = "bg-amber-100 text-amber-700"
    } else if (daysFromToday === 0) {
      statusLabel = "Due today"
      statusClass = "bg-orange-100 text-orange-700"
    } else {
      statusLabel = `Overdue by ${Math.abs(daysFromToday)} day${Math.abs(daysFromToday) === 1 ? "" : "s"}`
      statusClass = "bg-red-100 text-red-700"
    }
  }

  const spanPercent =
    dueDate && invoiceDate
      ? Math.min(100, Math.max(0, (daysDiff(invoiceDate, todayStr) / termDays) * 100))
      : 0

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
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

      <main className="max-w-2xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <Link
          href="/tools"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All tools
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Invoice Due Date Calculator</h1>
          <p className="text-slate-500">
            Find exact due dates for Net-15, Net-30, Net-60, and custom payment terms.
          </p>
        </div>

        {/* Calculator card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-4">
          {/* Invoice date */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Invoice Date</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Payment terms */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Payment Terms</label>
            <div className="flex gap-2 flex-wrap">
              {NET_TERMS.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTerm(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    selectedTerm === t
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-emerald-600"
                  }`}
                >
                  Net {t}
                </button>
              ))}
              <button
                onClick={() => setSelectedTerm("custom")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  selectedTerm === "custom"
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-emerald-600"
                }`}
              >
                Custom
              </button>
            </div>
            {selectedTerm === "custom" && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  className="w-28 px-3 py-2 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <span className="text-sm text-slate-500">days</span>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="border-t border-slate-100 pt-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Results</h2>
            {dueDate ? (
              <div className="space-y-4">
                {/* Due date — large */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Due date</span>
                  <span className="text-2xl font-bold text-slate-900">{formatDisplayDate(dueDate)}</span>
                </div>

                {/* Status badge */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Status</span>
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full ${statusClass}`}>
                    {statusLabel}
                  </span>
                </div>

                {/* Days remaining / overdue */}
                {daysFromToday !== null && daysFromToday !== 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                      {daysFromToday > 0 ? "Days remaining" : "Days overdue"}
                    </span>
                    <span className={`text-sm font-medium ${daysFromToday > 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {Math.abs(daysFromToday)} days
                    </span>
                  </div>
                )}

                {/* Calendar visual */}
                <div className="mt-2 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <span>{formatDisplayDate(invoiceDate)}</span>
                    <span>{formatDisplayDate(dueDate)}</span>
                  </div>
                  <div className="relative h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`absolute left-0 top-0 h-full rounded-full transition-all duration-300 ${
                        daysFromToday !== null && daysFromToday < 0
                          ? "bg-red-400"
                          : daysFromToday === 0
                          ? "bg-orange-400"
                          : "bg-emerald-400"
                      }`}
                      style={{ width: `${spanPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                    <span>Invoice date</span>
                    <span>Due date</span>
                  </div>
                </div>

                {/* Google Calendar button */}
                <a
                  href={googleCalendarUrl(dueDate, invoiceDate, termDays)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 border border-slate-200 hover:border-emerald-300 rounded-lg px-4 py-2 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  Add to Google Calendar
                </a>
              </div>
            ) : (
              <div className="py-4 text-center text-sm text-slate-400">
                Select an invoice date and payment terms above
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-medium text-slate-900 text-sm">Send this invoice with BillingBee</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Set payment terms once and BillingBee auto-calculates due dates and sends reminders for you.
            </p>
          </div>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors active:scale-95 shrink-0"
          >
            Send this invoice
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* SEO content */}
        <div className="mt-10 space-y-6 text-sm text-slate-500 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-800">How payment terms work</h2>
          <p>
            Payment terms like <strong>Net 30</strong> mean the invoice is due 30 calendar days after the
            invoice date. Select your invoice date and the applicable terms to instantly see the exact due
            date and how many days remain.
          </p>
          <h3 className="text-base font-semibold text-slate-800 !mt-8">Common payment terms</h3>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Net 15</strong> — Common for small projects or fast-paying clients</li>
            <li><strong>Net 30</strong> — Most common standard for freelancers and small businesses</li>
            <li><strong>Net 45</strong> — Typical for mid-size business contracts</li>
            <li><strong>Net 60 / Net 90</strong> — Common in enterprise or government procurement</li>
          </ul>
        </div>

        <FaqSection
          toolName="Invoice Due Date Calculator"
          faqs={[
            {
              question: "What is a standard payment term for freelancers?",
              answer: "Net 15 or Net 30 are most common. Net 15 (payment due in 15 days) works well for smaller projects and established clients. Net 30 is standard for larger businesses. Avoid Net 60 unless the client is a large corporate — it's essentially giving them a free loan for two months.",
            },
            {
              question: "What does Net 30 mean on an invoice?",
              answer: "Net 30 means payment is due 30 calendar days from the invoice date. It has nothing to do with business days. If you invoice on June 1, payment is due July 1. Some businesses use EOM (End of Month) terms instead, meaning payment is due at the end of the month following the invoice month.",
            },
            {
              question: "Should I offer early payment discounts?",
              answer: "Only if cash flow is tight. A common structure is 2/10 Net 30 — 2% discount if paid within 10 days, otherwise full amount due in 30. This effectively costs you 2% to get paid 20 days earlier. For most freelancers, chasing the discount isn't worth it — better to tighten your payment terms instead.",
            },
            {
              question: "How do I handle clients who always pay late?",
              answer: "Three options: require upfront deposits (50% before, 50% on delivery), shorten payment terms to Net 7 or Net 15, or add a late fee they'll actually feel. The best clients pay on time — chronic late payers are a cash flow liability regardless of how big the project is.",
            },
            {
              question: "Can I change payment terms mid-project?",
              answer: "Yes, but communicate it clearly and in writing. Give at least 30 days notice for existing clients. For new projects or renewals, updated terms apply automatically. Never change terms retroactively on already-issued invoices without client agreement.",
            },
            {
              question: "Does BillingBee track invoice due dates automatically?",
              answer: "Yes — BillingBee tracks every invoice due date, shows overdue invoices on your dashboard, and sends automatic reminders to clients before and after the due date. Free to start at billingbee.co.",
            },
          ]}
        />
      </main>
    </div>
  )
}
