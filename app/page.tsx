import type { Metadata } from "next"
import Link from "next/link"
import { generatePageMetadata } from "@/lib/metadata"
import {
  Zap,
  FileText,
  CreditCard,
  Users,
  BarChart3,
  Shield,
  Star,
  ArrowRight,
  Check,
  Globe,
  Sparkles,
} from "lucide-react"

// ── Metadata + JSON-LD ────────────────────────────────────────────────────────

export const metadata: Metadata = {
  ...generatePageMetadata(
    "BillingBee — AI-Powered Invoicing for Indian Freelancers & SMBs",
    "Create GST-compliant invoices in seconds with natural language AI. Accept Razorpay & Stripe payments. Auto-send reminders. Trusted by 700+ freelancers.",
    "/",
    {
      keywords: [
        "invoice software India",
        "GST invoice generator",
        "AI invoicing tool",
        "freelancer billing app",
        "online invoice maker India",
        "Razorpay invoice",
      ],
    }
  ),
  other: {
    "application/ld+json": JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "BillingBee",
        url: "https://billingbee.co",
        logo: "https://billingbee.co/og-image.png",
        sameAs: ["https://twitter.com/billingbeeapp"],
        contactPoint: {
          "@type": "ContactPoint",
          email: "hello@billingbee.co",
          contactType: "customer support",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "BillingBee",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: "https://billingbee.co",
        description:
          "AI-powered invoicing software for Indian freelancers and small businesses. Create GST invoices with natural language, accept payments, and automate collections.",
        offers: [
          {
            "@type": "Offer",
            name: "Free",
            price: "0",
            priceCurrency: "INR",
            description: "5 invoices/month, basic AI, PDF download",
          },
          {
            "@type": "Offer",
            name: "Pro",
            price: "999",
            priceCurrency: "INR",
            billingIncrement: "P1M",
            description: "Unlimited invoices, AI collections, payment links",
          },
          {
            "@type": "Offer",
            name: "Business",
            price: "2499",
            priceCurrency: "INR",
            billingIncrement: "P1M",
            description: "Team seats, white-label, API access, priority support",
          },
        ],
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.8",
          ratingCount: "247",
          bestRating: "5",
        },
      },
    ]),
  },
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
        <Icon size={20} className="text-emerald-600" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  )
}

function Testimonial({
  quote,
  name,
  role,
}: {
  quote: string
  name: string
  role: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex gap-0.5 mb-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
        ))}
      </div>
      <p className="text-sm text-gray-700 leading-relaxed mb-4">&ldquo;{quote}&rdquo;</p>
      <div>
        <p className="text-sm font-semibold text-gray-900">{name}</p>
        <p className="text-xs text-gray-400">{role}</p>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold text-gray-900">BillingBee</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <Link href="/plans-price" className="hover:text-gray-900 transition-colors">Pricing</Link>
            <Link href="/free-invoice-generator" className="hover:text-gray-900 transition-colors">Free Tools</Link>
            <Link href="/faq" className="hover:text-gray-900 transition-colors">FAQ</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors hidden sm:block">
              Sign in
            </Link>
            <Link
              href="/generate"
              className="text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition-all active:scale-95"
            >
              Try free →
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-200 mb-6">
          <Sparkles size={12} />
          Trusted by 700+ Indian freelancers
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-gray-900 leading-tight tracking-tight mb-6">
          Invoice in seconds.
          <br />
          <span className="text-emerald-600">Get paid faster.</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Just say &ldquo;Invoice Acme Corp ₹25,000 for design work&rdquo; — BillingBee AI creates a
          GST-ready PDF, sends it, and follows up automatically.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
          <Link
            href="/generate"
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-4 rounded-2xl text-base transition-all active:scale-95 shadow-lg shadow-emerald-200"
          >
            Create your first invoice free
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/plans-price"
            className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-semibold px-8 py-4 rounded-2xl text-base transition-all active:scale-95"
          >
            See pricing
          </Link>
        </div>

        <div className="flex items-center justify-center gap-6 text-sm text-gray-400 flex-wrap">
          {[
            "No credit card required",
            "GST-compliant PDFs",
            "Razorpay & Stripe built-in",
          ].map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <Check size={14} className="text-emerald-500" />
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-gray-900 mb-3">Everything you need to get paid</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            From invoice creation to payment collection — all in one place, powered by AI.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            icon={Sparkles}
            title="Natural language invoicing"
            description="Just describe what you did. AI fills in client details, amounts, GST, and due dates automatically."
          />
          <FeatureCard
            icon={FileText}
            title="GST-compliant PDFs"
            description="Every invoice is GST-ready with CGST/SGST split, GSTIN, and proper invoice numbering."
          />
          <FeatureCard
            icon={CreditCard}
            title="Instant payment links"
            description="Accept payments via Razorpay (UPI, cards, net banking) or Stripe. Payment link auto-included in every invoice."
          />
          <FeatureCard
            icon={Users}
            title="Automated collections"
            description="AI sends polite reminders at 7, 3, and 1 day before due — and escalates overdue invoices automatically."
          />
          <FeatureCard
            icon={BarChart3}
            title="Revenue analytics"
            description="See monthly revenue, overdue amounts, top clients, and cash flow — updated in real time."
          />
          <FeatureCard
            icon={Shield}
            title="Client portal"
            description="Clients get a branded portal to view invoices, download PDFs, and pay — without creating an account."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-16 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-gray-900 mb-3">From chat to paid in 3 steps</h2>
          <p className="text-gray-500 mb-12">No forms. No spreadsheets. Just talk to your AI assistant.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Describe the work",
                desc: "\"Invoice TechCorp ₹50,000 for website development, due in 15 days\"",
              },
              {
                step: "2",
                title: "Review & send",
                desc: "AI creates the invoice. Review, tweak if needed, then send with one click.",
              },
              {
                step: "3",
                title: "Get paid",
                desc: "Client clicks the payment link, pays via UPI or card. You get notified instantly.",
              },
            ].map(({ step, title, desc }) => (
              <div key={step}>
                <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-4">
                  {step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-gray-900 mb-3">Loved by freelancers across India</h2>
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
            ))}
          </div>
          <p className="text-sm text-gray-400">4.8 / 5 from 247 reviews</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Testimonial
            quote="I used to spend 2 hours every week on invoices. Now it takes 5 minutes. The AI just gets it."
            name="Priya Sharma"
            role="UX Designer, Bangalore"
          />
          <Testimonial
            quote="GST calculations used to terrify me. BillingBee handles all of it. My CA loves the exports."
            name="Rahul Mehta"
            role="Full-stack Developer, Mumbai"
          />
          <Testimonial
            quote="The payment link feature alone is worth it. Clients pay the same day now instead of chasing them for weeks."
            name="Ananya Krishnan"
            role="Content Strategist, Chennai"
          />
        </div>
      </section>

      {/* CTA banner */}
      <section className="bg-emerald-600 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-black mb-4">Start free. No credit card needed.</h2>
          <p className="text-emerald-100 mb-8 text-lg">
            Free plan includes 5 invoices/month, PDF downloads, and GST calculations.
            Upgrade when you&apos;re ready.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/generate"
              className="inline-flex items-center justify-center gap-2 bg-white text-emerald-700 font-bold px-8 py-4 rounded-2xl text-base hover:bg-emerald-50 transition-all active:scale-95"
            >
              Create invoice — it&apos;s free
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/plans-price"
              className="inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white border border-emerald-500 font-semibold px-8 py-4 rounded-2xl text-base transition-all active:scale-95"
            >
              Compare plans
            </Link>
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
          {[
            { href: "/free-invoice-generator", label: "Free Invoice Generator", icon: FileText },
            { href: "/free-invoice-resources", label: "Invoice Templates", icon: Globe },
            { href: "/plans-price", label: "Pricing", icon: CreditCard },
            { href: "/faq", label: "FAQ", icon: Sparkles },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all text-gray-600 hover:text-emerald-700"
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-emerald-600 rounded flex items-center justify-center">
              <Zap size={10} className="text-white" />
            </div>
            <span className="font-semibold text-gray-600">BillingBee</span>
            <span>— AI Invoicing for India</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link href="/plans-price" className="hover:text-gray-600 transition-colors">Pricing</Link>
            <Link href="/faq" className="hover:text-gray-600 transition-colors">FAQ</Link>
            <Link href="/contact" className="hover:text-gray-600 transition-colors">Contact</Link>
            <Link href="/privacy-policy" className="hover:text-gray-600 transition-colors">Privacy</Link>
            <Link href="/terms-service" className="hover:text-gray-600 transition-colors">Terms</Link>
          </div>
          <p>© {new Date().getFullYear()} BillingBee. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
