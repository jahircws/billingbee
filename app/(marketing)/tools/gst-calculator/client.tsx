"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Copy, Check, ArrowRight } from "lucide-react"
import FaqSection from "../_components/FaqSection"

const GST_RATES = [5, 12, 18, 28] as const
type GSTRate = (typeof GST_RATES)[number]

function copyToClipboard(text: string, onCopied: () => void) {
  navigator.clipboard.writeText(text).then(onCopied).catch(() => {})
}

function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = useCallback(() => {
    copyToClipboard(value, () => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
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

interface ResultRowProps {
  label: string
  value: string
  sub?: string
  large?: boolean
}

function ResultRow({ label, value, sub, large }: ResultRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div>
        <span className={large ? "font-semibold text-slate-900" : "text-sm text-slate-600"}>{label}</span>
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      </div>
      <div className="flex items-center gap-1">
        <span className={large ? "text-lg font-bold text-slate-900" : "text-sm font-medium text-slate-800"}>
          ₹{value}
        </span>
        <CopyButton value={value} />
      </div>
    </div>
  )
}

export default function GSTCalculatorClient() {
  const [mode, setMode] = useState<"add" | "remove">("add")
  const [amount, setAmount] = useState("")
  const [rate, setRate] = useState<GSTRate>(18)

  const numAmount = parseFloat(amount) || 0

  let baseAmount = 0
  let gstAmount = 0
  let totalAmount = 0

  if (mode === "add") {
    baseAmount = numAmount
    gstAmount = (numAmount * rate) / 100
    totalAmount = numAmount + gstAmount
  } else {
    totalAmount = numAmount
    baseAmount = numAmount / (1 + rate / 100)
    gstAmount = totalAmount - baseAmount
  }

  const halfRate = rate / 2
  const halfGst = gstAmount / 2
  const hasAmount = numAmount > 0

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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">GST Calculator</h1>
          <p className="text-slate-500">
            Add or remove GST from any amount. Supports all standard Indian GST rates.
          </p>
        </div>

        {/* Calculator card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-4">
          {/* Mode toggle */}
          <div className="flex rounded-lg bg-slate-100 p-1 mb-6 w-fit">
            <button
              onClick={() => setMode("add")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === "add"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Add GST
            </button>
            <button
              onClick={() => setMode("remove")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === "remove"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Remove GST
            </button>
          </div>

          {/* Amount input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {mode === "add" ? "Amount (before GST)" : "Amount (inclusive of GST)"}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Rate selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">GST Rate</label>
            <div className="flex gap-2 flex-wrap">
              {GST_RATES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRate(r)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    rate === r
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-emerald-600"
                  }`}
                >
                  {r}%
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="border-t border-slate-100 pt-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Results</h2>
            {hasAmount ? (
              <div>
                <ResultRow label="Base Amount" value={formatINR(baseAmount)} />
                <ResultRow
                  label={`GST Amount (${rate}%)`}
                  value={formatINR(gstAmount)}
                  sub={`CGST ${halfRate}% = ₹${formatINR(halfGst)} · SGST ${halfRate}% = ₹${formatINR(halfGst)}`}
                />
                <ResultRow label="Total Amount" value={formatINR(totalAmount)} large />
              </div>
            ) : (
              <div className="py-4 text-center text-sm text-slate-400">
                Enter an amount above to see the breakdown
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-medium text-slate-900 text-sm">Need to send a GST invoice?</p>
            <p className="text-xs text-slate-500 mt-0.5">
              BillingBee auto-calculates GST and generates compliant invoices in seconds.
            </p>
          </div>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors active:scale-95 shrink-0"
          >
            Generate a GST Invoice
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* SEO content */}
        <div className="mt-10 space-y-6 text-sm text-slate-500 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-800">How to use this GST calculator</h2>
          <p>
            Choose <strong>Add GST</strong> if you have a base price and want to find the total amount your customer
            pays. Choose <strong>Remove GST</strong> (reverse calculation) if you have the GST-inclusive total and
            want to find the original base amount.
          </p>
          <p>
            Select the applicable GST rate — 5%, 12%, 18%, or 28% — then enter your amount. Results update
            instantly and show the CGST and SGST split (each half the total rate) for intra-state transactions.
          </p>
          <h3 className="text-base font-semibold text-slate-800 !mt-8">GST rates in India</h3>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>5%</strong> — Essential goods, some food items, economy travel</li>
            <li><strong>12%</strong> — Processed foods, business class air travel, some textiles</li>
            <li><strong>18%</strong> — Most services, electronics, software (most common rate)</li>
            <li><strong>28%</strong> — Luxury goods, automobiles, tobacco</li>
          </ul>
        </div>

        <FaqSection
          toolName="GST Calculator"
          faqs={[
            {
              question: "What is GST and how is it calculated in India?",
              answer: "GST (Goods and Services Tax) is India's unified indirect tax system. It's calculated by applying the applicable rate (5%, 12%, 18%, or 28%) to the base price of goods or services. For example, a ₹10,000 service with 18% GST results in ₹1,800 tax and a total invoice of ₹11,800.",
            },
            {
              question: "What is the difference between CGST, SGST, and IGST?",
              answer: "CGST and SGST apply to transactions within the same state — each is half the total GST rate. IGST applies to inter-state transactions and is the full rate. So an 18% intra-state transaction has 9% CGST + 9% SGST, while inter-state has 18% IGST.",
            },
            {
              question: "Who needs to register for GST?",
              answer: "Businesses with annual turnover above ₹40 lakhs (goods) or ₹20 lakhs (services) must register. For special category states, the threshold is ₹20 lakhs and ₹10 lakhs respectively. E-commerce sellers must register regardless of turnover.",
            },
            {
              question: "Can I claim GST input tax credit?",
              answer: "Yes, registered businesses can claim Input Tax Credit (ITC) on GST paid for business purchases. This means you only pay GST on the value you add, not the full amount. ITC cannot be claimed on personal expenses or exempt supplies.",
            },
            {
              question: "What happens if I miss the GST filing deadline?",
              answer: "Late filing attracts a penalty of ₹50 per day (₹25 CGST + ₹25 SGST) for regular returns, subject to a maximum of ₹5,000. For nil returns, it's ₹20 per day. Interest at 18% per annum also applies on the tax due.",
            },
            {
              question: "Can BillingBee automatically calculate GST on my invoices?",
              answer: "Yes — BillingBee automatically applies GST, CGST, SGST, and IGST based on your client's location. Your GST invoice is generated in seconds with the correct tax breakdown. Free to start at billingbee.co.",
            },
          ]}
        />
      </main>
    </div>
  )
}
