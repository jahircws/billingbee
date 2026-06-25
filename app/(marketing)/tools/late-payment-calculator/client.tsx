"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import FaqSection from "../_components/FaqSection"
import { ArrowLeft, Copy, Check, ArrowRight } from "lucide-react"

const CURRENCIES = [
  { code: "INR", symbol: "₹" },
  { code: "USD", symbol: "$" },
  { code: "GBP", symbol: "£" },
  { code: "EUR", symbol: "€" },
] as const

type CurrencyCode = (typeof CURRENCIES)[number]["code"]

function today(): string {
  return new Date().toISOString().split("T")[0]
}

function formatAmount(value: number, symbol: string): string {
  return `${symbol}${new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }).catch(() => {})
  }, [value])
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
      aria-label="Copy value"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

export default function LatePaymentCalculatorClient() {
  const [invoiceAmount, setInvoiceAmount] = useState("")
  const [currency, setCurrency] = useState<CurrencyCode>("INR")
  const [dueDate, setDueDate] = useState("")
  const [paymentDate, setPaymentDate] = useState(today())
  const [annualRate, setAnnualRate] = useState("18")
  const [graceDays, setGraceDays] = useState("0")

  const symbol = CURRENCIES.find((c) => c.code === currency)?.symbol ?? "₹"
  const amount = parseFloat(invoiceAmount) || 0
  const rate = parseFloat(annualRate) || 0
  const grace = parseInt(graceDays) || 0

  let daysOverdue = 0
  let interestAmount = 0
  let totalAmount = 0
  let lineItem = ""
  let isNotYetOverdue = false
  let hasEnoughData = false

  if (amount > 0 && dueDate && paymentDate) {
    hasEnoughData = true
    const due = new Date(dueDate)
    const payment = new Date(paymentDate)
    const effectiveDue = new Date(due)
    effectiveDue.setDate(effectiveDue.getDate() + grace)

    const diffMs = payment.getTime() - effectiveDue.getTime()
    daysOverdue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))

    if (diffMs <= 0) {
      isNotYetOverdue = true
    } else {
      interestAmount = (amount * rate * daysOverdue) / (100 * 365)
      totalAmount = amount + interestAmount
      lineItem = `Late payment interest (${daysOverdue} days @ ${rate}% p.a.) — ${formatAmount(interestAmount, symbol)}`
    }
  }

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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Late Payment Interest Calculator</h1>
          <p className="text-slate-500">
            Calculate exactly how much interest to charge on overdue invoices.
          </p>
        </div>

        {/* Calculator card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-4">
          {/* Invoice amount + currency */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Invoice Amount</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">{symbol}</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                {CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setCurrency(c.code)}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      currency === c.code
                        ? "bg-emerald-500 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {c.symbol}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Invoice Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Rate + grace */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Annual Interest Rate (%)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={annualRate}
                  onChange={(e) => setAnnualRate(e.target.value)}
                  className="w-full px-3 pr-8 py-2.5 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Grace Period (days)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={graceDays}
                onChange={(e) => setGraceDays(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Results */}
          <div className="border-t border-slate-100 pt-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Results</h2>
            {!hasEnoughData ? (
              <div className="py-4 text-center text-sm text-slate-400">
                Fill in the fields above to calculate interest
              </div>
            ) : isNotYetOverdue ? (
              <div className="py-4 text-center text-sm text-emerald-600 bg-emerald-50 rounded-lg">
                Invoice is not yet overdue
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Days overdue</span>
                  <span className="text-sm font-medium text-slate-800">{daysOverdue} days</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Interest amount</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-slate-800">{formatAmount(interestAmount, symbol)}</span>
                    <CopyButton value={interestAmount.toFixed(2)} />
                  </div>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <span className="font-semibold text-slate-900">Total to charge</span>
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-slate-900">{formatAmount(totalAmount, symbol)}</span>
                    <CopyButton value={totalAmount.toFixed(2)} />
                  </div>
                </div>

                {/* Copyable line item */}
                <div className="mt-4 bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Ready to paste line item</span>
                    <CopyButton value={lineItem} />
                  </div>
                  <p className="text-sm text-slate-700 font-mono">{lineItem}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-medium text-slate-900 text-sm">Automate late payment reminders with BillingBee</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Send automatic reminders before and after due dates so you never have to chase clients manually.
            </p>
          </div>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors active:scale-95 shrink-0"
          >
            Automate late payment reminders
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* SEO content */}
        <div className="mt-10 space-y-6 text-sm text-slate-500 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-800">How to use this late payment calculator</h2>
          <p>
            Enter the original invoice amount and select your currency. Set the invoice due date and the date
            payment was (or will be) received. Enter your annual interest rate — 18% per annum is common in
            India — and any grace period you offer clients before interest starts accruing.
          </p>
          <p>
            The calculator uses simple interest: <strong>Interest = Principal × Rate × Days / 365</strong>. The
            copyable line item gives you exact wording to paste into a follow-up invoice or credit note.
          </p>
          <h3 className="text-base font-semibold text-slate-800 !mt-8">What interest rate should I charge?</h3>
          <p>
            The rate should be stated in your original invoice terms or client contract. Common rates are
            1.5–2% per month (18–24% per annum). In India, 18% p.a. is a widely used benchmark that aligns
            with standard bank lending rates.
          </p>
        </div>

        <FaqSection
          toolName="Late Payment Calculator"
          faqs={[
            {
              question: "Can I legally charge interest on late payments in India?",
              answer: "Yes. Under the MSME Development Act 2006, buyers must pay within 45 days of delivery. If they don't, they owe compound interest at three times the RBI bank rate. For non-MSME transactions, the rate depends on your contract terms — always specify payment terms and late fees in your invoice or agreement.",
            },
            {
              question: "What is a reasonable late payment fee for freelancers?",
              answer: "1.5-2% per month (18-24% annually) is standard and enforceable. Below 1% and clients won't take it seriously. Above 3% may be challenged. More importantly, state it clearly on your invoice before work begins — a late fee mentioned only after payment is overdue is hard to enforce.",
            },
            {
              question: "How long should I wait before charging a late payment fee?",
              answer: "Charge from day one after the due date — that's what your contract says. In practice, send a polite reminder on day 1, a firmer reminder on day 7 with the fee calculated, and escalate at day 30. Don't wait to add the fee; waiting signals you won't enforce it.",
            },
            {
              question: "What should I do if a client refuses to pay at all?",
              answer: "Send a formal legal notice first — many clients pay immediately. If that fails, file in the MSME Samadhaan portal (for MSME disputes) or approach a civil court for amounts above ₹1 lakh. For smaller amounts, consumer courts or lok adalats are faster. Always have a signed contract or email confirmation before starting work.",
            },
            {
              question: "How do late payments affect my business cash flow?",
              answer: "One overdue invoice of ₹50,000 for 60 days costs you more than just the invoice amount — it affects your ability to pay vendors, take new projects, and plan expenses. Track your average collection days (total receivables ÷ daily revenue) and aim to keep it under 30 days.",
            },
            {
              question: "Can BillingBee automatically send late payment reminders?",
              answer: "Yes — BillingBee Pro sends automatic payment reminders before and after the due date, calculates late fees, and follows up with clients so you don't have to. Free to start at billingbee.co.",
            },
          ]}
        />
      </main>
    </div>
  )
}
