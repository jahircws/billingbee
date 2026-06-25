"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import FaqSection from "../_components/FaqSection"

const CURRENCIES = [
  { code: "INR", symbol: "₹", label: "INR" },
  { code: "USD", symbol: "$", label: "USD" },
  { code: "GBP", symbol: "£", label: "GBP" },
  { code: "EUR", symbol: "€", label: "EUR" },
] as const
type CurrencyCode = (typeof CURRENCIES)[number]["code"]

function formatNum(value: number, symbol: string): string {
  return `${symbol}${new Intl.NumberFormat("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`
}

interface SliderFieldProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  display?: string
}

function SliderField({ label, value, min, max, step = 1, onChange, display }: SliderFieldProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className="text-sm font-semibold text-emerald-600">{display ?? value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none bg-slate-200 accent-emerald-500 cursor-pointer"
      />
      <div className="flex justify-between text-xs text-slate-400 mt-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

interface NumberFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  symbol: string
  placeholder?: string
  hint?: string
}

function NumberField({ label, value, onChange, symbol, placeholder, hint }: NumberFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {hint && <p className="text-xs text-slate-400 mb-1.5">{hint}</p>}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">{symbol}</span>
        <input
          type="number"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "0"}
          className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>
    </div>
  )
}

interface ResultCardProps {
  label: string
  value: string
  large?: boolean
}

function ResultCard({ label, value, large }: ResultCardProps) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm p-4 ${large ? "col-span-2" : ""}`}>
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</div>
      <div className={large ? "text-3xl font-bold text-emerald-600" : "text-xl font-bold text-slate-900"}>
        {value}
      </div>
    </div>
  )
}

export default function FreelancerRateClient() {
  const [currency, setCurrency] = useState<CurrencyCode>("INR")
  const [annualTarget, setAnnualTarget] = useState("")
  const [hoursPerDay, setHoursPerDay] = useState(8)
  const [daysPerWeek, setDaysPerWeek] = useState(5)
  const [vacationWeeks, setVacationWeeks] = useState(2)
  const [monthlyOverhead, setMonthlyOverhead] = useState("")
  const [nonBillablePct, setNonBillablePct] = useState(20)

  const sym = CURRENCIES.find((c) => c.code === currency)?.symbol ?? "₹"

  const results = useMemo(() => {
    const target = parseFloat(annualTarget) || 0
    const overhead = parseFloat(monthlyOverhead) || 0

    const workingWeeks = 52 - vacationWeeks
    const totalWorkingDays = workingWeeks * daysPerWeek
    const totalWorkingHours = totalWorkingDays * hoursPerDay

    const billableFraction = 1 - nonBillablePct / 100
    const billableHours = totalWorkingHours * billableFraction

    const annualOverhead = overhead * 12
    const totalNeeded = target + annualOverhead

    if (billableHours <= 0) return null

    const hourlyRate = totalNeeded / billableHours
    const dailyRate = hourlyRate * hoursPerDay * billableFraction
    const monthlyBilling = totalNeeded / 12

    return { hourlyRate, dailyRate, monthlyBilling, billableHours }
  }, [annualTarget, hoursPerDay, daysPerWeek, vacationWeeks, monthlyOverhead, nonBillablePct])

  const hasInput = (parseFloat(annualTarget) || 0) > 0

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

      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <Link
          href="/tools"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All tools
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Freelancer Rate Calculator</h1>
          <p className="text-slate-500">
            Find the minimum hourly rate you need to charge to meet your income goal after accounting for
            overhead and non-billable time.
          </p>
        </div>

        {/* Live results — shown above fold when filled */}
        {hasInput && results && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <ResultCard label="Minimum hourly rate" value={formatNum(results.hourlyRate, sym)} large />
            <ResultCard label="Effective daily rate" value={formatNum(results.dailyRate, sym)} />
            <ResultCard label="Monthly billing needed" value={formatNum(results.monthlyBilling, sym)} />
            <ResultCard
              label="Total billable hours / year"
              value={`${Math.round(results.billableHours).toLocaleString()} hrs`}
            />
          </div>
        )}

        {/* Inputs card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Currency</label>
            <div className="flex gap-2 flex-wrap">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setCurrency(c.code)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    currency === c.code
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-emerald-600"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <NumberField
            label="Annual income target"
            value={annualTarget}
            onChange={setAnnualTarget}
            symbol={sym}
            placeholder="1200000"
            hint="The take-home amount you want to earn per year before tax"
          />

          <SliderField
            label="Hours per day"
            value={hoursPerDay}
            min={1}
            max={12}
            onChange={setHoursPerDay}
            display={`${hoursPerDay} hrs`}
          />

          <SliderField
            label="Working days per week"
            value={daysPerWeek}
            min={3}
            max={7}
            onChange={setDaysPerWeek}
            display={`${daysPerWeek} days`}
          />

          <SliderField
            label="Weeks vacation per year"
            value={vacationWeeks}
            min={0}
            max={12}
            onChange={setVacationWeeks}
            display={`${vacationWeeks} wk${vacationWeeks !== 1 ? "s" : ""}`}
          />

          <NumberField
            label="Monthly overhead / expenses"
            value={monthlyOverhead}
            onChange={setMonthlyOverhead}
            symbol={sym}
            placeholder="0"
            hint="Optional: software, internet, equipment, co-working space, etc."
          />

          <SliderField
            label="Non-billable time"
            value={nonBillablePct}
            min={0}
            max={50}
            onChange={setNonBillablePct}
            display={`${nonBillablePct}%`}
          />
          <p className="text-xs text-slate-400 -mt-4">
            Time spent on admin, sales, networking, and other non-client work. 20% is a common starting point.
          </p>

          {!hasInput && (
            <div className="bg-slate-50 rounded-lg border border-slate-100 p-4 text-center text-sm text-slate-400">
              Enter your annual income target above to see your rate
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-4 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-medium text-slate-900 text-sm">Ready to invoice at your new rate?</p>
            <p className="text-xs text-slate-500 mt-0.5">
              BillingBee helps you create professional invoices and track payments in minutes.
            </p>
          </div>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors active:scale-95 shrink-0"
          >
            Create your first invoice at this rate
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* SEO content */}
        <div className="mt-10 space-y-4 text-sm text-slate-500 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-800">How is the freelancer rate calculated?</h2>
          <p>
            The calculator works out your <strong>minimum viable rate</strong> — the lowest you can charge while
            still meeting your income target and covering costs.
          </p>
          <p>
            Formula:{" "}
            <em>
              Hourly rate = (Annual income target + Annual overhead) ÷ Total billable hours
            </em>
          </p>
          <p>
            Total billable hours accounts for your working schedule minus vacation time, then further reduced by
            the non-billable percentage (time spent on admin, business development, etc. that you can&apos;t charge
            clients for).
          </p>
          <h3 className="text-base font-semibold text-slate-800 !mt-8">Why 20% non-billable time?</h3>
          <p>
            Most freelancers spend roughly 20% of their working time on activities they can&apos;t directly bill for
            — answering emails, sending proposals, accounting, learning, and marketing. New freelancers often
            underestimate this and underprice their work as a result.
          </p>
        </div>

        <FaqSection
          toolName="Freelancer Rate Calculator"
          faqs={[
            {
              question: "How do I calculate my hourly rate as a freelancer in India?",
              answer: "Start with your desired annual income, add business expenses (software, equipment, taxes), then divide by your actual billable hours — typically 1,000-1,200 hours per year after accounting for holidays, admin work, and unpaid time. Most freelancers underestimate expenses and overbill hours, which is why they end up underpaid.",
            },
            {
              question: "Should I charge hourly or per project as a freelancer?",
              answer: "Project-based pricing almost always earns more. Hourly rates cap your income at your hours worked. Project pricing rewards efficiency — if you finish faster because you're experienced, you earn more per hour. Use hourly only for ongoing retainers or open-ended work where scope is unclear.",
            },
            {
              question: "How much should a freelancer save for taxes in India?",
              answer: "Set aside 25-30% of every payment if you're under the presumptive taxation scheme (Section 44ADA). If your income exceeds ₹50 lakhs, you'll need a tax audit. Advance tax is due quarterly — missing it means interest under Section 234B/C.",
            },
            {
              question: "What is a good profit margin for freelancers?",
              answer: "After all expenses, aim for 60-70% net margin. If you're keeping less than 50%, either your rates are too low or your expenses are too high. Factor in platform fees, software subscriptions, self-employment taxes, and unpaid client time when calculating your true margin.",
            },
            {
              question: "How do I raise my freelance rates without losing clients?",
              answer: "Give 30-60 days notice, frame it around the value you've delivered, and anchor to a specific reason (inflation, new skills, market rates). Raise rates for new clients first — existing clients get a grace period. Most good clients will stay; the ones who leave were likely your most difficult ones anyway.",
            },
            {
              question: "Can BillingBee help me send professional invoices at my new rates?",
              answer: "Yes — BillingBee lets you set your rate, generate a professional invoice in seconds, and send a payment link your client can pay instantly via Stripe, Razorpay, or UPI. Free to start at billingbee.co.",
            },
          ]}
        />
      </main>
    </div>
  )
}
