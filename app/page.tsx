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
    "BillingBee — AI-Powered Invoicing for Freelancers & Small Businesses",
    "Create professional invoices in any currency in 30 seconds with AI. Accept Stripe, Razorpay & PayPal payments. Auto-send reminders. Trusted by 7,000+ freelancers worldwide.",
    "/",
    {
      keywords: [
        "invoice software",
        "online invoice generator",
        "AI invoicing tool",
        "freelancer billing app",
        "online invoice maker",
        "multi-currency invoicing",
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
          "AI-powered invoicing software for freelancers and small businesses worldwide. Create invoices in any currency with natural language, accept payments, and automate collections.",
        offers: [
          {
            "@type": "Offer",
            name: "Free",
            price: "0",
            priceCurrency: "USD",
            description: "5 invoices/month, basic AI, PDF download",
          },
          {
            "@type": "Offer",
            name: "Pro",
            price: "9.99",
            priceCurrency: "USD",
            billingIncrement: "P1M",
            description: "Unlimited invoices, AI collections, payment links",
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
              href="/register"
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
          Trusted by 7,000+ freelancers worldwide
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-gray-900 leading-tight tracking-tight mb-6">
          Your AI invoicing assistant.
          <br />
          <span className="text-emerald-600">Invoice done in 30 seconds.</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Just say &ldquo;Invoice Acme Corp $2,500 for design work&rdquo; — BillingBee AI creates a
          polished, tax-ready PDF, sends it, and follows up automatically. No forms. No spreadsheets.
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
            "Stripe · Razorpay · PayPal",
            "Any currency, any country",
          ].map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <Check size={14} className="text-emerald-500" />
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* Social proof bar */}
      <section className="border-y border-gray-100 bg-white py-5">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/badges/nvidia-inception-program-badge.svg"
            alt="BillingBee is a member of the NVIDIA Inception program"
            style={{ width: 160, height: "auto" }}
          />
          <div className="h-px sm:h-8 w-16 sm:w-px bg-gray-200" />
          {[
            { rating: "4.8", source: "Google" },
            { rating: "4.7", source: "Trustpilot" },
          ].map(({ rating, source }) => (
            <div key={source} className="inline-flex items-center gap-2">
              <span className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                ))}
              </span>
              <span className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900">{rating}</span> on {source}
              </span>
            </div>
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
            description="Just describe what you did. AI fills in client details, amounts, taxes, and due dates automatically."
          />
          <FeatureCard
            icon={Globe}
            title="Built for India, works everywhere"
            description="GST-compliant invoices, Razorpay and UPI support, INR billing. Plus 30+ currencies for international clients."
          />
          <FeatureCard
            icon={CreditCard}
            title="Payment links that work everywhere"
            description="Accept payments via Stripe, Razorpay, or PayPal — cards, UPI, wallets, and bank transfers. One link works everywhere."
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
            title="Client portal (no sign-up needed)"
            description="Clients get a branded portal to view invoices, download PDFs, and pay — without creating an account."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-16 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-gray-900 mb-3">From conversation to cash in 3 steps</h2>
          <p className="text-gray-500 mb-12">No forms. No spreadsheets. Just talk to your AI assistant.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Describe the work",
                desc: "\"Invoice TechCorp $5,000 for website development, due in 15 days\"",
              },
              {
                step: "2",
                title: "Review & send",
                desc: "AI creates the invoice. Review, tweak if needed, then send with one click.",
              },
              {
                step: "3",
                title: "Get paid",
                desc: "Client clicks the payment link, pays by card, bank transfer, UPI, or PayPal. You get notified instantly.",
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

      {/* Works everywhere callout */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="bg-gray-900 rounded-3xl p-10 md:p-14 text-center">
          <h2 className="text-3xl font-black text-white mb-4">
            Your clients are global. Your invoicing should be too.
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-10 text-lg leading-relaxed">
            Send invoices in USD, EUR, GBP, INR, or 30+ other currencies. Accept payments via Stripe in the US,
            Razorpay in India, or PayPal anywhere. BillingBee handles the currency — you handle the work.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            {[
              { icon: Globe, label: "30+ currencies" },
              { icon: CreditCard, label: "Stripe · Razorpay · PayPal" },
              { icon: Check, label: "GST-ready for India" },
              { icon: Zap, label: "UPI support" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full">
                <Icon size={14} className="text-emerald-400" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-gray-900 mb-3">Loved by freelancers worldwide</h2>
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
            ))}
          </div>
          <p className="text-sm text-gray-400">4.8 / 5 from 247 reviews</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Testimonial
            quote="I send invoices to clients in three different currencies. BillingBee handles every one without me touching a spreadsheet."
            name="Sarah Whitfield"
            role="Freelance Copywriter, London, UK"
          />
          <Testimonial
            quote="Setup took five minutes and the automatic reminders mean I no longer have to awkwardly chase late payments myself."
            name="Marco Rossi"
            role="Web Developer, Milan, Italy"
          />
          <Testimonial
            quote="Clients pay the moment they open the invoice now. The branded portal makes my little studio look seriously professional."
            name="Emily Carter"
            role="Photographer, Austin, USA"
          />
          <Testimonial
            quote="I used to spend 2 hours every week on invoices. Now it takes 5 minutes. The AI just gets it."
            name="Priya Sharma"
            role="UX Designer, Bangalore"
          />
          <Testimonial
            quote="Tax calculations used to terrify me. BillingBee handles all of it. My accountant loves the exports."
            name="Rahul Mehta"
            role="Full-stack Developer, Remote (US clients)"
          />
          <Testimonial
            quote="The payment link feature alone is worth it. Clients pay the same day now instead of chasing them for weeks."
            name="Ananya Krishnan"
            role="Content Strategist"
          />
        </div>
      </section>

      {/* Pricing summary */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-gray-900 mb-3">Simple pricing. Free to start.</h2>
          <p className="text-gray-500">No credit card required. No time limit on the free plan.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-6">
          {/* Free */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900">Free</h3>
              <p className="text-sm text-gray-500 mt-1">Perfect for getting started.</p>
            </div>
            <div className="text-4xl font-black text-gray-900 mb-6">Free forever</div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {["5 invoices/month", "AI invoice creation", "PDF downloads", "Basic tax support"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/generate"
              className="text-center py-3 rounded-xl font-semibold text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Start free →
            </Link>
          </div>
          {/* Pro */}
          <div className="bg-white rounded-2xl border-2 border-emerald-500 shadow-lg p-6 flex flex-col relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="bg-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow">Most popular</span>
            </div>
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900">Pro</h3>
              <p className="text-sm text-gray-500 mt-1">Everything you need to get paid.</p>
            </div>
            <div className="text-4xl font-black text-gray-900 mb-6">$9.99<span className="text-base font-normal text-gray-400">/mo</span></div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {[
                "Unlimited invoices",
                "AI collections & reminders",
                "Payment links (Stripe, Razorpay, PayPal)",
                "White-label client portal",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/register?trial=pro"
              className="text-center py-3 rounded-xl font-semibold text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              Start 14-day trial →
            </Link>
          </div>
        </div>
        <p className="text-center text-sm text-gray-400">
          <Link href="/plans-price" className="underline hover:text-gray-600">See full plan details →</Link>
        </p>
      </section>

      {/* CTA banner */}
      <section className="bg-emerald-600 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-black mb-4">Your first invoice takes 30 seconds. It&apos;s free.</h2>
          <p className="text-emerald-100 mb-8 text-lg">
            5 invoices/month, AI invoice creation, PDF downloads, automatic tax. No credit card. No time limit on the free plan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/generate"
              className="inline-flex items-center justify-center gap-2 bg-white text-emerald-700 font-bold px-8 py-4 rounded-2xl text-base hover:bg-emerald-50 transition-all active:scale-95"
            >
              Create your first invoice free
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
            <span>— AI Invoicing for freelancers everywhere</span>
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
        <p className="max-w-6xl mx-auto px-4 mt-6 text-center text-xs text-gray-300">
          © {new Date().getFullYear()} NVIDIA, the NVIDIA logo, and NVIDIA Inception are
          trademarks and/or registered trademarks of NVIDIA Corporation in the U.S. and
          other countries.
        </p>
      </footer>
    </div>
  )
}
