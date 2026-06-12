import type { Metadata } from "next"
import Link from "next/link"
import { generatePageMetadata } from "@/lib/metadata"
import { Zap, ArrowRight, ChevronDown } from "lucide-react"

export const revalidate = 86400

export const metadata: Metadata = {
  ...generatePageMetadata(
    "FAQ — Frequently Asked Questions | BillingBee",
    "Answers to common questions about BillingBee invoicing, multi-currency support, payments, plans, and data security.",
    "/faq",
    { keywords: ["BillingBee FAQ", "invoice software questions", "invoicing help", "billing app support"] }
  ),
  other: {
    "application/ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Is BillingBee free to use?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes! BillingBee has a free plan that lets you create up to 5 invoices per month with PDF download and automatic tax calculations. No credit card required.",
          },
        },
        {
          "@type": "Question",
          name: "Does BillingBee support taxes and GST?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. BillingBee works in any currency and supports custom tax lines worldwide. For India, every invoice includes CGST/SGST split, GSTIN fields, and proper invoice numbering compliant with GST rules.",
          },
        },
        {
          "@type": "Question",
          name: "Which payment gateways does BillingBee support?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "BillingBee supports Stripe (cards, wallets, and bank transfers) worldwide, plus Razorpay for users in India. Payment links are automatically included in every invoice.",
          },
        },
        {
          "@type": "Question",
          name: "How does the AI invoice creation work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Just describe the work in plain English — e.g. 'Invoice Acme Corp $2,500 for web design, due in 15 days'. The AI extracts client details, amounts, tax rates, and due dates automatically.",
          },
        },
        {
          "@type": "Question",
          name: "Can I cancel my subscription anytime?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, you can cancel your Pro or Business subscription at any time from Settings → Plan. You'll retain access until the end of your billing period.",
          },
        },
      ],
    }),
  },
}

const FAQS = [
  {
    q: "Is BillingBee free to use?",
    a: "Yes! The free plan includes up to 5 invoices/month, PDF downloads, and automatic tax calculations. No credit card required. Upgrade to Pro for unlimited invoices and AI collections.",
  },
  {
    q: "Does BillingBee support taxes and GST?",
    a: "Yes. BillingBee works in any currency and supports custom tax lines worldwide. For India specifically, every invoice includes CGST/SGST split, GSTIN field, HSN/SAC codes, and sequential numbering — fully GST compliant, with exportable reports for your accountant.",
  },
  {
    q: "Which payment gateways does BillingBee support?",
    a: "BillingBee supports Stripe (cards, wallets, bank transfers) worldwide, plus Razorpay for users in India. Every invoice includes a payment link — your clients click, pay, and you get notified instantly.",
  },
  {
    q: "How does the AI invoice creation work?",
    a: "Just describe the work in plain English: \"Invoice Acme Corp $2,500 for web design, due in 15 days.\" AI extracts the client, amount, tax rate, and due date — and creates a professional invoice in seconds.",
  },
  {
    q: "Can I use BillingBee without internet?",
    a: "BillingBee is a web app that requires internet. However, downloaded PDF invoices work offline and can be shared anytime.",
  },
  {
    q: "How does automated collections work?",
    a: "On the Pro plan, BillingBee sends polite AI-written reminders at 7 days, 3 days, and 1 day before due. Overdue invoices get escalating follow-ups. You can customise the tone and timing.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. All data is encrypted in transit (TLS) and at rest. We use industry-standard Postgres with row-level security. We never share your data with third parties.",
  },
  {
    q: "Can I customise the invoice template?",
    a: "Yes. You can add your logo, custom colours, business address, tax IDs (such as GSTIN, VAT, or EIN), bank details, and payment terms. Pro and Business plans support custom branding on the client portal.",
  },
  {
    q: "What happens when I exceed the free plan limit?",
    a: "You'll be notified when you approach the 5 invoice limit. You can upgrade to Pro at any time to get unlimited invoices, or download existing invoices as PDFs.",
  },
  {
    q: "Can I cancel my subscription anytime?",
    a: "Yes, cancel anytime from Settings → Plan. You retain full access until the end of your current billing period. No cancellation fees.",
  },
]

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
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

      <main className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-gray-500 text-lg">Everything you need to know about BillingBee.</p>
        </div>

        <div className="space-y-3">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
                {q}
                <ChevronDown size={16} className="text-gray-400 shrink-0 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                {a}
              </div>
            </details>
          ))}
        </div>

        <div className="mt-12 bg-emerald-50 rounded-2xl border border-emerald-200 p-8 text-center">
          <h2 className="font-bold text-gray-900 mb-2">Still have questions?</h2>
          <p className="text-sm text-gray-600 mb-5">We&apos;re happy to help. Reach us at hello@billingbee.co</p>
          <div className="flex gap-3 justify-center">
            <Link href="/contact" className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all active:scale-95">
              Contact us
              <ArrowRight size={14} />
            </Link>
            <Link href="/generate" className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all active:scale-95">
              Try BillingBee free
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-100 bg-white py-6 text-center text-sm text-gray-400">
        <Link href="/" className="hover:text-gray-600">← Back to BillingBee</Link>
      </footer>
    </div>
  )
}
