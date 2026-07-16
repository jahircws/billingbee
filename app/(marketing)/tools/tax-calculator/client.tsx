"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Download, Info, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import FaqSection from "../_components/FaqSection"

// ── Tax logic ────────────────────────────────────────────────────────────────

const MAX_INCOME = 5_000_000 // ₹50L

function calcIncomeTax(income: number): number {
  if (income <= 300_000) return 0
  let tax = 0
  if (income > 300_000) tax += Math.min(income - 300_000, 400_000) * 0.05
  if (income > 700_000) tax += Math.min(income - 700_000, 300_000) * 0.20
  if (income > 1_000_000) tax += (income - 1_000_000) * 0.30
  return tax
}

// Section 234C advance tax percentages
const ADVANCE_TAX_QUARTERS = [
  { label: "Q1 — Apr to Jun", due: "15 Jun", pct: 0.15 },
  { label: "Q2 — Jul to Sep", due: "15 Sep", pct: 0.45 },
  { label: "Q3 — Oct to Dec", due: "15 Dec", pct: 0.75 },
  { label: "Q4 — Jan to Mar", due: "15 Mar", pct: 1.00 },
]

// ── Formatters ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(n))
}

function fmtShort(n: number) {
  if (n >= 10_00_000) return `₹${(n / 10_00_000).toFixed(1)}Cr`
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`
  return `₹${n}`
}

// ── Sub-components ────────────────────────────────────────────────────────────

const BUSINESS_TYPES = ["Freelance", "Startup", "Consultant"] as const
type BusinessType = (typeof BUSINESS_TYPES)[number]

function SlabVisualizer({ income }: { income: number }) {
  const slabs = [
    { from: 0,         to: 300_000,   rate: "0%",  label: "₹0 – ₹3L",    color: "bg-emerald-400" },
    { from: 300_000,   to: 700_000,   rate: "5%",  label: "₹3L – ₹7L",   color: "bg-blue-400"    },
    { from: 700_000,   to: 1_000_000, rate: "20%", label: "₹7L – ₹10L",  color: "bg-amber-400"   },
    { from: 1_000_000, to: MAX_INCOME, rate: "30%", label: "₹10L+",       color: "bg-rose-400"    },
  ]

  return (
    <div className="space-y-2.5">
      {slabs.map((slab) => {
        const active = income > slab.from
        const filled = active
          ? Math.min(income - slab.from, slab.to - slab.from) / (slab.to - slab.from)
          : 0
        return (
          <div key={slab.rate} className={`transition-opacity duration-300 ${active ? "opacity-100" : "opacity-30"}`}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-500">{slab.label}</span>
              <span className={`text-xs font-bold ${active ? "text-slate-700" : "text-slate-400"}`}>{slab.rate}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${slab.color}`}
                style={{ width: `${Math.round(filled * 100)}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface StatTileProps {
  label: string
  value: string
  sub?: string
  colorClass?: string
}

function StatTile({ label, value, sub, colorClass = "bg-slate-50 text-slate-900" }: StatTileProps) {
  return (
    <div className={`rounded-xl p-4 ${colorClass}`}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-xl font-bold leading-tight">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

interface BreakdownRowProps {
  label: string
  value: string
  sub?: string
  variant?: "default" | "blue" | "amber" | "red" | "bold"
}

function BreakdownRow({ label, value, sub, variant = "default" }: BreakdownRowProps) {
  const bg =
    variant === "blue"  ? "bg-blue-50"  :
    variant === "amber" ? "bg-amber-50" :
    variant === "red"   ? "bg-red-50"   : ""
  const valueColor =
    variant === "blue"  ? "text-blue-700"   :
    variant === "amber" ? "text-amber-700"  :
    variant === "red"   ? "text-rose-600"   :
    variant === "bold"  ? "text-slate-900"  : "text-slate-700"

  return (
    <div className={`flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-0 ${bg}`}>
      <div>
        <span className={`text-sm ${variant === "bold" ? "font-bold text-slate-900" : "text-slate-600"}`}>{label}</span>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <span className={`text-sm font-semibold tabular-nums ${valueColor} ${variant === "bold" ? "text-base" : ""}`}>
        {value}
      </span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TaxCalculatorClient() {
  const [income, setIncome] = useState(1_200_000)
  const [inputStr, setInputStr] = useState("1200000")
  const [gstRegistered, setGstRegistered] = useState(false)
  const [businessType, setBusinessType] = useState<BusinessType>("Freelance")

  const handleSlider = (v: number) => {
    setIncome(v)
    setInputStr(String(v))
  }

  const handleTextInput = (raw: string) => {
    setInputStr(raw)
    const n = parseInt(raw.replace(/[^0-9]/g, ""), 10)
    if (!isNaN(n) && n >= 0 && n <= MAX_INCOME) setIncome(n)
    else if (raw === "" || raw === "0") setIncome(0)
  }

  const result = useMemo(() => {
    const incomeTax = calcIncomeTax(income)
    const cess = incomeTax * 0.04
    const totalIncomeTax = incomeTax + cess
    const gst = gstRegistered ? income * 0.18 : 0
    const totalTax = totalIncomeTax + gst
    const monthlyTax = totalTax / 12
    const effectiveRate = income > 0 ? (totalIncomeTax / income) * 100 : 0

    let cumPct = 0
    const quarters = ADVANCE_TAX_QUARTERS.map((q) => {
      const instalment = (q.pct - cumPct) * totalIncomeTax
      cumPct = q.pct
      return { ...q, instalment }
    })

    return { incomeTax, cess, totalIncomeTax, gst, totalTax, monthlyTax, effectiveRate, quarters }
  }, [income, gstRegistered])

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* Header */}
      <header className="bg-white border-b border-slate-100 no-print">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" alt="BillingBee" width={140} height={28} className="brightness-0" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
              Sign in
            </Link>
            <Link href="/register" className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-95">
              Try free →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-5">
        {/* Breadcrumb */}
        <Link
          href="/tools"
          className="no-print inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All tools
        </Link>

        {/* Hero */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold text-slate-900">Freelancer Tax Calculator India 2026</h1>
          </div>
          <p className="text-slate-500 text-base">
            Estimate your income tax, GST liability, and advance tax schedule. Updated for FY&nbsp;2025–26 new regime.
          </p>
        </div>

        {/* ── Inputs card ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 no-print space-y-6">
          {/* Business type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2.5">Business Type</label>
            <div className="flex gap-2 flex-wrap">
              {BUSINESS_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setBusinessType(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    businessType === t
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-600"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Income slider */}
          <div>
            <div className="flex items-baseline justify-between mb-3">
              <label className="text-sm font-medium text-slate-700">Annual Income</label>
              <span className="text-emerald-600 font-bold text-lg tabular-nums">
                ₹{fmt(income)}
                <span className="ml-1.5 text-xs font-normal text-slate-400">({fmtShort(income)})</span>
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={MAX_INCOME}
              step={50_000}
              value={income}
              onChange={(e) => handleSlider(Number(e.target.value))}
              className="w-full accent-emerald-500 mb-3 cursor-pointer"
            />
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none">₹</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={inputStr}
                  onChange={(e) => handleTextInput(e.target.value)}
                  className="w-full pl-7 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="1200000"
                />
              </div>
              <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">Max ₹50L</span>
            </div>
          </div>

          {/* GST toggle */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-5">
            <div>
              <p className="text-sm font-medium text-slate-700">GST Registered?</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Mandatory if annual service turnover &gt; ₹20L
              </p>
            </div>
            <button
              role="switch"
              aria-checked={gstRegistered}
              onClick={() => setGstRegistered((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                gstRegistered ? "bg-emerald-500" : "bg-slate-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                  gstRegistered ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* ── Results card ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">Tax Breakdown</h2>
            <button
              onClick={() => window.print()}
              className="no-print inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatTile label="Annual Income" value={`₹${fmt(income)}`} colorClass="bg-slate-50 text-slate-900" />
            <StatTile label="Monthly Income" value={`₹${fmt(income / 12)}`} colorClass="bg-slate-50 text-slate-900" />
            <StatTile
              label="Income Tax + Cess"
              value={`₹${fmt(result.totalIncomeTax)}`}
              colorClass="bg-blue-50 text-blue-700"
            />
            <StatTile
              label="Monthly Tax Due"
              value={`₹${fmt(result.monthlyTax)}`}
              sub={`${result.effectiveRate.toFixed(1)}% effective`}
              colorClass="bg-rose-50 text-rose-600"
            />
          </div>

          {/* Breakdown rows */}
          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <BreakdownRow label="Income Tax (slabs)" value={`₹${fmt(result.incomeTax)}`} />
            <BreakdownRow
              label="Education Cess"
              value={`₹${fmt(result.cess)}`}
              sub="4% on income tax"
            />
            <BreakdownRow
              label="Total Income Tax"
              value={`₹${fmt(result.totalIncomeTax)}`}
              variant="blue"
            />
            {gstRegistered && (
              <BreakdownRow
                label="Annual GST Collected"
                value={`₹${fmt(result.gst)}`}
                sub="18% on income — remitted to government"
                variant="amber"
              />
            )}
            <BreakdownRow
              label="Total Annual Tax Burden"
              value={`₹${fmt(result.totalTax)}`}
              variant="bold"
            />
          </div>

          {/* Slab visualizer */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Tax Slab Breakdown
            </p>
            <SlabVisualizer income={income} />
          </div>
        </div>

        {/* ── Advance Tax Schedule ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <h2 className="text-base font-bold text-slate-800">Advance Tax Schedule</h2>
              <p className="text-xs text-slate-400 mt-0.5">Required when annual tax liability exceeds ₹10,000</p>
            </div>
            <Badge variant="secondary" className="shrink-0 text-xs">Section 234C</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {result.quarters.map((q, i) => (
              <div
                key={i}
                className="flex items-center justify-between border border-slate-100 rounded-xl px-4 py-3.5 hover:border-emerald-200 hover:bg-emerald-50/40 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">{q.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Due by {q.due}</p>
                </div>
                <p className="text-base font-bold text-emerald-600 tabular-nums">₹{fmt(q.instalment)}</p>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 bg-slate-50 rounded-xl px-4 py-3 text-xs text-slate-500">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
            <p>
              Pay the cumulative percentage by each due date (15%, 45%, 75%, 100% of annual tax). Late payment
              attracts 1% interest per month under Sections 234B &amp; 234C.
            </p>
          </div>
        </div>

        {/* GST contextual note */}
        {gstRegistered && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-800">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
            <div>
              <strong>About that ₹{fmt(result.gst)} GST figure:</strong> This is collected{" "}
              <em>from your clients</em> and passed to the government — it&apos;s not an extra cost to you.
              You must file <strong>GSTR-1</strong> and <strong>GSTR-3B</strong> every quarter (or month
              if turnover &gt; ₹5Cr).
            </div>
          </div>
        )}

        {/* ── CTA ── */}
        <div className="no-print bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 space-y-2">
            <p className="font-bold text-white text-base">Ready to send GST-compliant invoices?</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {["Auto-calculate GST", "Instant PDF invoices", "Track payments"].map((f) => (
                <span key={f} className="inline-flex items-center gap-1.5 text-xs text-emerald-100">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  {f}
                </span>
              ))}
            </div>
          </div>
          <Link
            href="/register"
            className="shrink-0 inline-flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold text-sm px-4 py-2 rounded-xl transition-all active:scale-95"
          >
            Start Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* ── SEO prose ── */}
        <div className="space-y-5 text-sm text-slate-500 leading-relaxed pt-4">
          <h2 className="text-base font-semibold text-slate-800">
            How is freelancer income tax calculated in India (2026)?
          </h2>
          <p>
            Freelancers and consultants pay tax under the{" "}
            <strong>new tax regime (FY 2025–26)</strong> with four progressive slabs: 0% up to ₹3L,
            5% from ₹3L–7L, 20% from ₹7L–10L, and 30% above ₹10L. A flat 4% education cess
            applies on the total income tax computed from these slabs.
          </p>
          <p>
            Separately, if your annual service income exceeds ₹20 lakhs, GST registration is
            mandatory. You collect 18% from clients and remit it quarterly — it&apos;s not an
            additional personal cost, but it does require GSTR-1 and GSTR-3B filing.
          </p>
          <h3 className="text-base font-semibold text-slate-800 !mt-6">
            What is advance tax and do I need to pay it?
          </h3>
          <p>
            If estimated annual tax exceeds ₹10,000, you must pay advance tax in four instalments.
            Deadlines follow the 15 Jun / 15 Sep / 15 Dec / 15 Mar schedule. Missing instalments
            attracts 1% monthly interest under Sections 234B and 234C — the quarterly schedule
            above shows exactly what you owe by each date.
          </p>
        </div>

        <FaqSection
          toolName="Freelancer Tax Calculator"
          faqs={[
            {
              question: "Which tax regime should a freelancer choose in 2026?",
              answer:
                "Most freelancers benefit from the new regime (lower slab rates, no deductions). The old regime only wins if your total deductions — 80C, HRA, NPS etc. — exceed roughly ₹3.75L. This calculator uses the new regime slabs for FY 2025–26.",
            },
            {
              question: "Do I need to pay GST as a freelancer in India?",
              answer:
                "Yes, once your annual service income crosses ₹20 lakhs (₹10L in special category states). You must register, charge 18% GST to clients, and file GSTR-1 + GSTR-3B. Toggle the GST switch above to include it in your estimate.",
            },
            {
              question: "What is the Section 44ADA presumptive scheme?",
              answer:
                "Professionals (doctors, lawyers, architects, IT consultants, freelancers) with gross receipts under ₹75L can declare 50% of receipts as net income under Section 44ADA and pay tax on that. It eliminates the need to maintain detailed books. If your real expenses are below 50% of income, 44ADA is usually more beneficial.",
            },
            {
              question: "How do I pay advance tax online?",
              answer:
                "Pay via the Income Tax e-Filing portal (incometax.gov.in) using Challan 280 — select 'Advance Tax' (code 100), enter your PAN and assessment year. Net banking, UPI, and debit cards are all accepted.",
            },
            {
              question: "Can BillingBee automatically calculate GST on my invoices?",
              answer:
                "Yes — BillingBee applies CGST/SGST/IGST automatically based on your client's location and generates a compliant PDF invoice in seconds. It's free to start at billingbee.co.",
            },
          ]}
        />
      </main>
    </div>
  )
}
