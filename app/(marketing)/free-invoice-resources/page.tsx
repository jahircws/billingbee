import type { Metadata } from "next"
import Link from "next/link"
import { generatePageMetadata } from "@/lib/metadata"
import { Zap, ArrowRight, Download, FileText } from "lucide-react"

export const revalidate = 86400

export const metadata: Metadata = generatePageMetadata(
  "Free Invoice Templates & Resources for Freelancers | BillingBee",
  "Download free invoice templates for designers, developers, consultants, and agencies. Excel, Word, and PDF formats. Multi-currency, with GST support for India.",
  "/free-invoice-resources",
  {
    keywords: [
      "free invoice template",
      "invoice template download",
      "invoice format Word Excel PDF",
      "freelancer invoice template",
      "consultant invoice template",
      "free billing template",
    ],
  }
)

const TEMPLATES = [
  {
    title: "Freelance Designer Invoice",
    desc: "Perfect for UI/UX designers, graphic designers, and illustrators. Includes project milestones and revision rounds.",
    tags: ["Design", "Creative"],
    type: "Service invoice",
  },
  {
    title: "Software Developer Invoice",
    desc: "For developers billing hourly or per project. Includes feature breakdown, hours logged, and hourly rate.",
    tags: ["Tech", "Hourly"],
    type: "Service invoice",
  },
  {
    title: "Consultant Invoice",
    desc: "Professional consulting invoice with engagement details, deliverables, and retainer breakdown.",
    tags: ["Consulting", "Retainer"],
    type: "Retainer invoice",
  },
  {
    title: "Content Writer Invoice",
    desc: "For writers billing per word, per article, or per project. Includes word count and topic breakdown.",
    tags: ["Content", "Writing"],
    type: "Per-unit invoice",
  },
  {
    title: "Marketing Agency Invoice",
    desc: "Multi-service agency invoice with individual service lines for SEO, ads, content, and reporting.",
    tags: ["Agency", "Multi-service"],
    type: "Service invoice",
  },
  {
    title: "GST Tax Invoice (India)",
    desc: "Fully GST-compliant invoice with CGST/SGST/IGST, GSTIN, HSN/SAC codes, and QR code support.",
    tags: ["GST", "Compliance"],
    type: "GST invoice",
  },
  {
    title: "Proforma Invoice",
    desc: "Send a proforma before the work starts to lock in the scope and amount. Converts to a real invoice on approval.",
    tags: ["Proforma", "Quote"],
    type: "Proforma",
  },
  {
    title: "Recurring Service Invoice",
    desc: "For monthly retainer clients. Auto-fills date, invoice number, and amount for consistent billing.",
    tags: ["Recurring", "Monthly"],
    type: "Recurring invoice",
  },
]

const GUIDES = [
  {
    title: "How to create a GST invoice in India",
    desc: "Step-by-step guide on mandatory fields, CGST/SGST split, invoice numbering, and filing requirements.",
    readTime: "5 min read",
  },
  {
    title: "How to get paid faster as a freelancer",
    desc: "Proven tactics: payment links, deposits, late fees, and how to write follow-up emails that actually work.",
    readTime: "7 min read",
  },
  {
    title: "GST for freelancers — what you need to know",
    desc: "Threshold limits, registration process, input tax credit, quarterly filing, and common mistakes to avoid.",
    readTime: "10 min read",
  },
  {
    title: "How to price your freelance services",
    desc: "Market rates, value-based pricing, how to raise rates with existing clients, and writing winning proposals.",
    readTime: "8 min read",
  },
]

export default function FreeInvoiceResourcesPage() {
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
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-5">
            Free Invoice Templates
            <br />
            <span className="text-emerald-600">for Freelancers Worldwide</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            Download ready-to-use invoice templates for designers, developers, consultants, and agencies.
            Or skip the template and let AI generate your invoice in seconds.
          </p>
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-4 rounded-2xl text-base transition-all active:scale-95 shadow-lg shadow-emerald-200"
          >
            Generate with AI — faster
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Templates grid */}
        <h2 className="text-2xl font-black text-gray-900 mb-6">Invoice Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-14">
          {TEMPLATES.map(({ title, desc, tags, type }) => (
            <div key={title} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-emerald-600" />
                </div>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{type}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">{desc}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5 flex-wrap">
                  {tags.map((t) => (
                    <span key={t} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                      {t}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/generate?template=${encodeURIComponent(title.toLowerCase().replace(/ /g, "-"))}&utm_source=resources`}
                  className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-semibold group-hover:gap-2 transition-all"
                >
                  Use template
                  <Download size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Guides */}
        <h2 className="text-2xl font-black text-gray-900 mb-6">Freelancer Guides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-14">
          {GUIDES.map(({ title, desc, readTime }) => (
            <div key={title} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <p className="text-xs text-gray-400 mb-2">{readTime}</p>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-emerald-600 rounded-2xl p-10 text-center text-white">
          <h2 className="text-2xl font-black mb-3">Skip the template. Use AI instead.</h2>
          <p className="text-emerald-100 mb-6 max-w-xl mx-auto">
            Instead of filling in a template, just tell BillingBee what you did — AI creates a professional, tax-ready invoice in any currency in seconds.
          </p>
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 bg-white text-emerald-700 font-bold px-8 py-4 rounded-2xl hover:bg-emerald-50 transition-all active:scale-95"
          >
            Generate invoice free
            <ArrowRight size={16} />
          </Link>
        </div>
      </main>

      <footer className="border-t border-gray-100 bg-white py-6 text-center text-sm text-gray-400">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/" className="hover:text-gray-600">Home</Link>
          <Link href="/free-invoice-generator" className="hover:text-gray-600">Invoice Generator</Link>
          <Link href="/plans-price" className="hover:text-gray-600">Pricing</Link>
          <Link href="/faq" className="hover:text-gray-600">FAQ</Link>
        </div>
      </footer>
    </div>
  )
}
