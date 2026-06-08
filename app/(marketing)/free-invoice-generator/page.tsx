import type { Metadata } from "next"
import Link from "next/link"
import { generatePageMetadata } from "@/lib/metadata"
import { Zap, ArrowRight, Download, FileText, Check } from "lucide-react"

export const revalidate = 86400

export const metadata: Metadata = {
  ...generatePageMetadata(
    "Free Invoice Generator — Create & Download GST Invoice PDF | BillingBee",
    "Create professional GST invoices online for free. Download PDF instantly. No signup required. Supports CGST/SGST, Razorpay payment links, and custom branding.",
    "/free-invoice-generator",
    {
      keywords: [
        "free invoice generator India",
        "GST invoice generator online free",
        "create invoice PDF free",
        "free billing software India",
        "invoice maker no signup",
        "free GST invoice download",
        "online invoice generator for freelancers",
      ],
    }
  ),
  other: {
    "application/ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "BillingBee Free Invoice Generator",
      url: "https://billingbee.co/free-invoice-generator",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
      },
      description:
        "Free online invoice generator for Indian freelancers and businesses. Create GST-compliant invoices and download as PDF. No account required.",
    }),
  },
}

const FEATURES = [
  "GST-compliant with CGST/SGST split",
  "PDF download in seconds",
  "Add your logo & brand colours",
  "UPI & Razorpay payment links",
  "Multiple currency support",
  "No signup for first invoice",
  "Auto invoice numbering",
  "Due date reminders",
]

const STEPS = [
  {
    n: "1",
    title: "Describe the work",
    desc: "Type what you did and the amount — AI fills in the rest",
  },
  {
    n: "2",
    title: "Add your details",
    desc: "Business name, GSTIN, logo — or skip for a quick invoice",
  },
  {
    n: "3",
    title: "Download & send",
    desc: "Get a professional PDF and a payment link your client can use",
  },
]

export default function FreeInvoiceGeneratorPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold text-gray-900">BillingBee</span>
          </Link>
          <Link href="/generate" className="text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition-all active:scale-95">
            Try free →
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-200 mb-5">
            <Download size={12} />
            Free PDF download — no credit card
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-5">
            Free GST Invoice Generator
            <br />
            <span className="text-emerald-600">for Indian Freelancers</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Create professional, GST-compliant invoices with AI in under 60 seconds.
            Download as PDF. Share a payment link. No signup needed for your first invoice.
          </p>
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-4 rounded-2xl text-base transition-all active:scale-95 shadow-lg shadow-emerald-200"
          >
            Create free invoice now
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Steps */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-10">
          <h2 className="text-2xl font-black text-gray-900 text-center mb-8">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className="text-center">
                <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-3">
                  {n}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white rounded-2xl border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
              <FileText size={18} className="text-emerald-600" />
              What&apos;s included — free
            </h2>
            <ul className="space-y-3">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-gray-700">
                  <Check size={15} className="text-emerald-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-emerald-600 rounded-2xl p-8 text-white">
            <h2 className="text-xl font-bold mb-4">Built for Indian freelancers</h2>
            <p className="text-emerald-100 text-sm mb-6 leading-relaxed">
              BillingBee understands Indian tax rules, Razorpay UPI flows, and the way freelancers
              actually work. Not a generic invoicing tool — built specifically for India.
            </p>
            <ul className="space-y-2 text-sm text-emerald-100 mb-6">
              {["CGST + SGST automatically calculated", "GSTIN validation built-in", "INR with locale-aware formatting", "Razorpay UPI payment links"].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check size={13} className="text-emerald-300 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/generate"
              className="inline-flex items-center gap-2 bg-white text-emerald-700 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-emerald-50 transition-all active:scale-95"
            >
              Generate invoice free
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* SEO content — FAQ */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Common questions</h2>
          <div className="space-y-5">
            {[
              {
                q: "Is this invoice generator really free?",
                a: "Yes. You can create up to 5 invoices per month completely free — no credit card, no hidden fees. Download PDF, share payment link, all free.",
              },
              {
                q: "Do I need to create an account?",
                a: "No signup is needed for your first invoice. After that, creating a free account lets you save invoices, track payments, and set up automated reminders.",
              },
              {
                q: "Is the invoice GST compliant?",
                a: "Yes. BillingBee automatically calculates CGST, SGST, IGST, and includes all mandatory GST fields. Your invoices are CA-ready.",
              },
              {
                q: "Can clients pay online?",
                a: "Yes. Every invoice includes an optional Razorpay payment link — your clients can pay via UPI, debit/credit card, or net banking.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">{q}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gray-900 rounded-2xl p-10 text-white">
          <h2 className="text-2xl font-black mb-3">Ready to create your invoice?</h2>
          <p className="text-gray-400 mb-6 text-sm">Takes less than 60 seconds. Free. No signup needed.</p>
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-8 py-4 rounded-2xl transition-all active:scale-95"
          >
            Generate invoice — free
            <ArrowRight size={16} />
          </Link>
        </div>
      </main>

      <footer className="border-t border-gray-100 bg-white py-6 text-center text-sm text-gray-400">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/" className="hover:text-gray-600">Home</Link>
          <Link href="/plans-price" className="hover:text-gray-600">Pricing</Link>
          <Link href="/free-invoice-resources" className="hover:text-gray-600">Invoice Templates</Link>
          <Link href="/faq" className="hover:text-gray-600">FAQ</Link>
        </div>
      </footer>
    </div>
  )
}
