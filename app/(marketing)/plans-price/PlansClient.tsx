"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Check, Zap, ChevronDown } from "lucide-react"

// ── Pricing config ─────────────────────────────────────────────────────────

const PLANS = [
  {
    id: "free",
    name: "Free",
    monthly: 0,
    description: "Perfect for freelancers just getting started.",
    cta: "Start for free",
    ctaHref: "/generate",
    popular: false,
    features: [
      "5 invoices/month",
      "3 clients",
      "5 proposals/month",
      "5 quotes/month",
      "Contracts (unlimited)",
      "AI invoice generation",
      "PDF export (watermarked)",
      "Basic reports",
      "Client portal (read-only)",
    ],
    missing: ["Unlimited invoices", "Unlimited proposals & quotes", "AI follow-ups", "Payment links", "White-label portal", "Cashflow forecast", "API access"],
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 9.99,
    description: "Everything you need to run a professional practice.",
    cta: "Start 14-day free trial",
    ctaHref: "/register?trial=pro",
    popular: true,
    features: [
      "Unlimited invoices & clients",
      "Unlimited proposals & quotes",
      "Logo on proposals & quotes",
      "No BillingBee branding on documents",
      "AI invoice generation",
      "AI payment follow-ups",
      "Payment links (Stripe, Razorpay, PayPal)",
      "PDF export (no watermark)",
      "White-label client portal",
      "Cashflow AI forecast",
      "Proposal → Contract → Invoice pipeline",
      "Full reports & exports",
      "Priority email support",
    ],
    missing: [],
  },
]

const COMPARE_FEATURES = [
  { label: "Invoices/month", free: "5", pro: "Unlimited" },
  { label: "Clients", free: "3", pro: "Unlimited" },
  { label: "Proposals/month", free: "5", pro: "Unlimited" },
  { label: "Quotes/month", free: "5", pro: "Unlimited" },
  { label: "Contracts", free: "Unlimited", pro: "Unlimited" },
  { label: "AI invoice generation", free: true, pro: true },
  { label: "AI payment follow-ups", free: false, pro: true },
  { label: "Payment links", free: false, pro: true },
  { label: "PDF — no watermark", free: false, pro: true },
  { label: "Logo on proposals & quotes", free: false, pro: true },
  { label: "White-label client portal", free: false, pro: true },
  { label: "Cashflow forecast", free: false, pro: true },
]

const FAQ = [
  {
    q: "What is BillingBee?",
    a: "BillingBee is an AI-powered invoicing and billing platform for freelancers, consultants, and small agencies. It writes invoices in seconds, automatically follows up on late payments, and gives you a cashflow forecast powered by Claude AI.",
  },
  {
    q: "Is the Free plan really free?",
    a: "Yes — no credit card required. You get 5 invoices/month and 3 clients forever. Upgrade whenever you outgrow it.",
  },
  {
    q: "How does the AI work?",
    a: "BillingBee uses Anthropic's Claude model. Describe your work in plain English and it generates a professional invoice. The follow-up AI reads your client's payment history and crafts personalized reminder emails.",
  },
  {
    q: "Can I switch from annual to monthly?",
    a: "Yes. You can change billing cycle at any time from Settings → Plan. Annual billing saves you 20% — billed as one payment upfront.",
  },
  {
    q: "What happens to my data if I cancel?",
    a: "Your data is retained for 90 days after cancellation. You can export all invoices and client data as CSV/PDF at any time before or after cancelling.",
  },
]

// ── Cell helper ────────────────────────────────────────────────────────────

function Cell({ value }: { value: boolean | string }) {
  if (typeof value === "boolean")
    return value ? (
      <Check className="h-4 w-4 text-emerald-500 mx-auto" />
    ) : (
      <span className="text-gray-300 text-lg leading-none mx-auto block text-center">—</span>
    )
  return <span className="text-sm text-gray-700 text-center block">{value}</span>
}

// ── Main component ─────────────────────────────────────────────────────────

export default function PricingPage({ isIndia }: { isIndia: boolean }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="BillingBee" width={140} height={28} className="brightness-0" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900">Sign in</Link>
            <Link
              href="/register"
              className="bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700"
            >
              Get started free
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-24">
        {/* Hero */}
        <div className="text-center pt-16 pb-12">
          <h1 className="text-4xl font-black text-gray-900 mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8">
            Start free. Upgrade when you need unlimited invoices, AI follow-ups, and payment links.
          </p>

        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-16 max-w-2xl mx-auto">
          {PLANS.map((plan) => {
            const price = plan.monthly

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 flex flex-col ${
                  plan.popular
                    ? "border-2 border-emerald-500 shadow-lg"
                    : "border border-gray-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow">
                      Most popular
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                </div>

                <div className="mb-6">
                  {price === 0 ? (
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-black text-gray-900">Free</span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-end gap-1">
                        <span className="text-4xl font-black text-gray-900">
                          {isIndia ? "₹849" : "$9.99"}
                        </span>
                        <span className="text-gray-400 mb-1">/mo</span>
                      </div>
                    </div>
                  )}
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.ctaHref}
                  className={`text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
                    plan.popular
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            )
          })}
        </div>

        {/* Feature comparison table */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Compare plans</h2>
          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-4 font-semibold text-gray-700 w-2/4">Feature</th>
                  <th className="px-4 py-4 font-semibold text-gray-700 text-center">Free</th>
                  <th className="px-4 py-4 font-semibold text-emerald-600 text-center bg-emerald-50/60">Pro</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_FEATURES.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}>
                    <td className="px-6 py-3 text-gray-700 font-medium">{row.label}</td>
                    <td className="px-4 py-3"><Cell value={row.free} /></td>
                    <td className="px-4 py-3 bg-emerald-50/30"><Cell value={row.pro} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Frequently asked questions</h2>
          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  {item.q}
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100">
                    <div className="pt-3">{item.a}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center bg-emerald-50 rounded-2xl p-10 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Start invoicing in 60 seconds</h2>
          <p className="text-gray-500 mb-6">No credit card required. Upgrade when you&apos;re ready.</p>
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-emerald-700 transition-colors text-base"
          >
            <Zap className="h-5 w-5" />
            Create your first invoice free
          </Link>
        </div>

        {/* NVIDIA Inception badge */}
        <div className="flex justify-center">
          <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-5 py-3">
            <Image src="/nvidia-inception.png" alt="NVIDIA Inception Program" width={100} height={34} className="object-contain" />
            <span className="text-sm text-slate-400">NVIDIA Inception Program Member</span>
          </div>
        </div>
      </main>
    </div>
  )
}
