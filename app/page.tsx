import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { generatePageMetadata } from "@/lib/metadata"
import {
  FileText,
  PenLine,
  Receipt,
  CreditCard,
  Mail,
  Globe,
  Zap,
  Users,
  TrendingUp,
  Shield,
  MessageSquare,
  CheckCircle,
  Star,
  Check,
} from "lucide-react"
import { DemoWidget } from "./_demo-widget"

// ── Step 2 — Metadata ─────────────────────────────────────────────────────────

export const metadata: Metadata = {
  ...generatePageMetadata(
    "BillingBee — AI-Powered Client Revenue Platform for Freelancers",
    "From proposal to payment — BillingBee writes proposals, signs contracts, collects payments, and follows up automatically. Stripe, Razorpay, PayPal. Free to start.",
    "/",
    {
      keywords: [
        "client revenue platform",
        "AI proposal software",
        "freelancer business platform",
        "contract management",
        "AI collections",
        "online payment software",
        "Razorpay invoicing",
        "GST invoice software",
        "Stripe payments freelancer",
      ],
    },
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
        applicationCategory: "Client Revenue Platform",
        operatingSystem: "Web",
        url: "https://billingbee.co",
        description:
          "From proposal to payment — BillingBee writes proposals, signs contracts, collects payments, and follows up automatically. Stripe, Razorpay, PayPal. Free to start.",
        offers: [
          {
            "@type": "Offer",
            name: "Free",
            price: "0",
            priceCurrency: "USD",
            description: "5 client documents/month, AI drafting, PDF download",
          },
          {
            "@type": "Offer",
            name: "Pro",
            price: "9.99",
            priceCurrency: "USD",
            billingIncrement: "P1M",
            description:
              "Unlimited proposals, contracts & invoices, AI collections, payment links",
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

// ── Inline components ─────────────────────────────────────────────────────────

function BentoCard({
  icon: Icon,
  title,
  description,
  className = "",
  dark = false,
  children,
}: {
  icon: React.ElementType
  title: string
  description: string
  className?: string
  dark?: boolean
  children?: React.ReactNode
}) {
  return (
    <div
      className={`rounded-2xl border p-6 md:p-8 transition-all duration-200 overflow-hidden ${
        dark
          ? "bg-[#1e2330] border-white/10 hover:border-white/20"
          : "bg-white border-slate-200 hover:shadow-md hover:border-slate-300"
      } ${className}`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
          dark ? "bg-white/10" : "bg-emerald-50"
        }`}
      >
        <Icon size={20} className={dark ? "text-emerald-400" : "text-emerald-500"} />
      </div>
      <h3
        className={`font-semibold mb-2 ${
          dark ? "text-white text-xl" : "text-slate-900 text-lg"
        }`}
      >
        {title}
      </h3>
      <p
        className={`text-sm leading-relaxed ${
          dark ? "text-slate-300" : "text-slate-500"
        }`}
      >
        {description}
      </p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}

function TestimonialCard({
  quote,
  name,
  role,
}: {
  quote: string
  name: string
  role: string
}) {
  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8">
      <div className="flex gap-0.5 mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
        ))}
      </div>
      <p className="text-slate-700 text-sm leading-relaxed">&ldquo;{quote}&rdquo;</p>
      <div className="mt-6 pt-4 border-t border-slate-200">
        <p className="text-slate-900 font-semibold text-sm">{name}</p>
        <p className="text-slate-400 text-xs mt-0.5">{role}</p>
      </div>
    </div>
  )
}

function MiniProposalStatus() {
  return (
    <div className="flex items-center gap-2 flex-wrap mt-6">
      {[
        { label: "Draft", cls: "bg-slate-100 text-slate-500" },
        { label: "→", cls: "text-slate-300 text-xs" },
        { label: "Sent", cls: "bg-blue-50 text-blue-600 border border-blue-200" },
        { label: "→", cls: "text-slate-300 text-xs" },
        { label: "Accepted", cls: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
        { label: "→", cls: "text-slate-300 text-xs" },
        { label: "Contract generated", cls: "bg-emerald-500 text-white" },
      ].map(({ label, cls }, i) =>
        label === "→" ? (
          <span key={i} className={cls}>
            {label}
          </span>
        ) : (
          <span key={i} className={`text-xs px-3 py-1 rounded-full font-medium ${cls}`}>
            {label}
          </span>
        ),
      )}
    </div>
  )
}

function MiniCollectionTimeline() {
  return (
    <div className="mt-4 space-y-3">
      {[
        { dot: "bg-emerald-500", day: "Day 1", label: "Friendly reminder" },
        { dot: "bg-amber-500", day: "Day 7", label: "Second notice" },
        { dot: "bg-red-500", day: "Day 30", label: "Final notice" },
      ].map(({ dot, day, label }) => (
        <div key={day} className="flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
          <span className="text-xs text-slate-400 w-10 shrink-0">{day}</span>
          <span className="text-xs text-slate-600 font-medium">{label}</span>
        </div>
      ))}
    </div>
  )
}

function MiniCashflowPreview() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-6">
      <p className="text-xs text-emerald-400 font-semibold">✦ AI Forecast</p>
      <p className="text-sm text-slate-300 leading-relaxed mt-2">
        &ldquo;Acme Corp typically pays 12 days late. Expect ₹1.2L in the next 30
        days — your healthiest month this quarter.&rdquo;
      </p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Step 3 — Nav ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 h-16 flex items-center">
        <div className="max-w-6xl mx-auto px-4 w-full flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center shrink-0">
            <Image src="/logo.png" alt="BillingBee" width={140} height={36} className="object-contain brightness-0" />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/plans-price" className="text-slate-600 hover:text-slate-900 transition-colors">
              Pricing
            </Link>
            <Link href="/free-invoice-generator" className="text-slate-600 hover:text-slate-900 transition-colors">
              Free Generator
            </Link>
            <Link href="/faq" className="text-slate-600 hover:text-slate-900 transition-colors">
              FAQ
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:block text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 active:scale-95 min-h-[36px] flex items-center"
            >
              Try free →
            </Link>
          </div>
        </div>
      </header>

      {/* ── Step 4 — Hero ────────────────────────────────────────────────── */}
      <section className="bg-[#1e2330] min-h-screen flex flex-col items-center justify-center text-center px-4 py-32 relative overflow-hidden">
        {/* Radial glow — cannot express in standard Tailwind */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(16,185,129,0.12) 0%, transparent 70%)",
          }}
        />
        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-8">
            <span>✦</span>
            AI-Powered Client Revenue Platform
          </div>

          {/* H1 — leads with user emotion, not product category */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-8">
            <span className="block">You do great work.</span>
            <span className="block">Getting paid shouldn&apos;t</span>
            <span className="block text-emerald-400">be the complicated part.</span>
          </h1>

          {/* The one sentence no competitor can say */}
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Describe your project — BillingBee writes the proposal, gets the contract
            signed, handles payment, and follows up automatically until money hits your
            account.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              href="/register"
              className="inline-flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3.5 rounded-xl font-semibold transition-all duration-200 active:scale-95 min-h-[52px]"
            >
              Start for free →
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center bg-white/5 hover:bg-white/10 text-white border border-white/20 px-8 py-3.5 rounded-xl font-semibold transition-all duration-200 min-h-[52px]"
            >
              See how it works ↓
            </a>
          </div>

          {/* Trust microline */}
          <p className="text-sm text-slate-400">
            Free to start · No card required
          </p>
        </div>
      </section>

      {/* ── Stats Strip ──────────────────────────────────────────────────── */}
      <section className="bg-emerald-50 border-y border-emerald-100 py-10">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-0">
            <div className="flex-1 text-center px-8">
              <div className="text-4xl font-bold text-emerald-500">$40M+</div>
              <div className="text-sm font-medium text-emerald-800 mt-1">invoiced through BillingBee</div>
              <div className="text-xs text-slate-500 mt-1">across 12 currencies worldwide</div>
            </div>
            <div className="hidden sm:block w-px h-16 bg-emerald-200" />
            <div className="flex-1 text-center px-8">
              <div className="text-4xl font-bold text-emerald-500">7,000+</div>
              <div className="text-sm font-medium text-emerald-800 mt-1">freelancers trust BillingBee</div>
              <div className="text-xs text-slate-500 mt-1">from 13+ countries</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Step 5 — Workflow Strip ───────────────────────────────────────── */}
      <section className="bg-white border-y border-slate-100 py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center">
            {[
              { icon: FileText,  label: "Proposal",    sub: "AI-written in seconds" },
              { icon: PenLine,   label: "Contract",    sub: "Auto-generated, e-signed" },
              { icon: Receipt,   label: "Invoice",     sub: "Tax-ready, any currency" },
              { icon: CreditCard,label: "Payment",     sub: "Stripe · Razorpay · PayPal" },
              { icon: Mail,      label: "Collections", sub: "6 AI follow-ups, automatic" },
            ].map(({ icon: Icon, label, sub }, i, arr) => (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center text-center py-4 md:py-0 px-4">
                  <Icon size={20} className="text-emerald-500" />
                  <span className="text-sm font-semibold text-slate-700 mt-2">{label}</span>
                  <span className="text-xs text-slate-400 mt-0.5">{sub}</span>
                </div>
                {i < arr.length - 1 && (
                  <>
                    {/* Desktop horizontal connector */}
                    <div className="hidden md:block w-8 lg:w-12 shrink-0 border-t border-dashed border-slate-200" />
                    {/* Mobile vertical connector */}
                    <div className="block md:hidden h-6 w-px border-l border-dashed border-slate-200 self-center" />
                  </>
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-slate-400 mt-8">
            The entire revenue journey — one tool — powered by AI.
          </p>
        </div>
      </section>

      {/* ── Step 6 — Trust Bar ───────────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-100 py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/badges/nvidia-inception-program-badge.svg"
            alt="NVIDIA Inception Program Member"
            width={130}
            height={40}
            className="grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300"
          />

          <div className="hidden md:block h-8 w-px bg-slate-200" />

          {[
            { rating: "4.8", source: "Google" },
            { rating: "4.7", source: "Trustpilot" },
          ].map(({ rating, source }) => (
            <div key={source} className="inline-flex items-center gap-2">
              <span className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
                ))}
              </span>
              <span className="text-sm text-slate-500">
                <span className="font-semibold text-slate-900">{rating}</span> on {source}
              </span>
            </div>
          ))}

          <div className="hidden md:block h-8 w-px bg-slate-200" />

          <div className="flex gap-2 flex-wrap justify-center">
            {["Stripe", "Razorpay", "PayPal"].map((p) => (
              <span
                key={p}
                className="bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium px-3 py-1.5 rounded-lg"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Step 7 — AI Demo Section ─────────────────────────────────────── */}
      <section className="bg-slate-50 py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-emerald-600 text-xs font-semibold uppercase tracking-widest">
            Try it
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mt-3">
            See it work. Right now. No signup.
          </h2>
          <p className="text-slate-500 text-lg mt-4 leading-relaxed">
            Type a project description — BillingBee AI turns it into a client-ready
            proposal in seconds.
          </p>
        </div>

        <DemoWidget />

        <div className="text-center mt-8">
          <Link
            href="/register"
            className="text-emerald-600 hover:text-emerald-700 text-sm font-medium transition-colors"
          >
            Create your first proposal free →
          </Link>
          <p className="text-xs text-slate-400 mt-1">
            No card required. First project in under 5 minutes.
          </p>
        </div>
      </section>

      {/* ── Step 8 — How It Works ────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-white py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-emerald-600 text-xs font-semibold uppercase tracking-widest">
            How it works
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mt-3">
            From first conversation to money in the bank.
          </h2>
          <p className="text-slate-500 text-lg mt-4">
            No Google Docs. No DocuSign. No &ldquo;just following up&rdquo; emails.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
          {[
            {
              step: "01",
              icon: MessageSquare,
              title: "Describe your project",
              body: "Write one sentence. BillingBee AI writes the proposal with scope, pricing, and timeline. Your client gets a portal link — no account needed — and signs the contract.",
            },
            {
              step: "02",
              icon: CheckCircle,
              title: "Client signs and pays",
              body: "Your client sees a branded portal. They sign the contract, view the invoice, and pay by card, bank transfer, or UPI. You get an instant notification.",
            },
            {
              step: "03",
              icon: Zap,
              title: "You get paid. Automatically followed up.",
              body: "Money arrives via Stripe, Razorpay, or PayPal. If a client is late, AI sends six escalating reminders — from a friendly nudge to a firm notice — so you never write 'just following up' again.",
            },
          ].map(({ step, icon: Icon, title, body }) => (
            <div key={step} className="relative">
              <span className="absolute -top-6 -left-2 text-8xl font-bold text-slate-100 select-none pointer-events-none leading-none">
                {step}
              </span>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Icon size={24} className="text-emerald-500" />
                </div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mt-5">
                  Step {step}
                </p>
                <h3 className="text-xl font-semibold text-slate-900 mt-1">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mt-2">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Step 9 — Features Bento Grid ─────────────────────────────────── */}
      <section className="bg-slate-50 py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-emerald-600 text-xs font-semibold uppercase tracking-widest">
            What&apos;s inside
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mt-3">
            Every tool for the business side of your craft.
          </h2>
          <p className="text-slate-500 text-lg mt-4">
            From the first proposal to the last payment.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {/* Card A — Lead card: Proposal + Contract */}
          <BentoCard
            icon={FileText}
            title="Proposal to contract — one click."
            description="Describe the project in plain English. AI writes a professional proposal with scope, pricing, and timeline. When your client accepts, a contract is auto-generated and sent for signing. No Google Docs. No DocuSign. No lost PDFs."
            className="md:col-span-2"
          >
            <MiniProposalStatus />
          </BentoCard>

          {/* Card B — Payments */}
          <BentoCard
            icon={CreditCard}
            title="Payment links that work everywhere"
            description="Cards, UPI, wallets, bank transfers — one link, any currency."
          >
            <div className="flex gap-2 flex-wrap mt-2">
              {["Stripe", "Razorpay", "PayPal"].map((p) => (
                <span
                  key={p}
                  className="bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium px-3 py-1 rounded-lg"
                >
                  {p}
                </span>
              ))}
            </div>
          </BentoCard>

          {/* Card C — Collections */}
          <BentoCard
            icon={Mail}
            title="Automated collections"
            description="AI sends 6 follow-ups — friendly to firm — automatically."
          >
            <MiniCollectionTimeline />
          </BentoCard>

          {/* Card D — Cashflow (dark) */}
          <BentoCard
            icon={TrendingUp}
            title="AI cashflow forecast — in plain English."
            description="Claude analyses 12 months of your payment history, names your late-paying clients, and tells you what to expect next month. Not a chart to interpret — a sentence you can act on."
            className="md:col-span-2"
            dark
          >
            <MiniCashflowPreview />
          </BentoCard>

          {/* Card E — Client portal */}
          <BentoCard
            icon={Shield}
            title="Client portal — no signup needed"
            description="Clients sign contracts, view invoices, and pay without creating an account. They see a professional. You get paid faster."
          >
            <span className="inline-block mt-4 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium px-3 py-1 rounded-full">
              Magic link access
            </span>
          </BentoCard>
        </div>
      </section>

      {/* ── Step 10 — Global + India Callout ─────────────────────────────── */}
      <section className="bg-[#1e2330] py-24 px-4 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest">
            Global by default. India-ready.
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mt-4">
            Built for wherever you work.
          </h2>
          <p className="text-slate-300 text-lg mt-4 leading-relaxed">
            Most tools are US-first, India-later. BillingBee was designed with both in
            mind — and built for every market in between.
          </p>
        </div>

        <div className="relative z-10 mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              icon: Globe,
              heading: "Global payments",
              body: "Stripe integration, 100+ currencies. Send in USD, EUR, GBP — FX conversion happens automatically.",
              tags: ["100+ currencies", "Stripe"],
            },
            {
              icon: Zap,
              heading: "India-native",
              body: "Razorpay, UPI support, GST-compliant invoices with INR billing. Everything Indian freelancers need — built in, not bolted on.",
              tags: ["Razorpay", "UPI", "GST-ready"],
            },
            {
              icon: Users,
              heading: "Clients anywhere",
              body: "Your client gets a branded portal link. They sign and pay from any device, any country — no account required.",
              tags: ["No client signup", "Magic link"],
            },
          ].map(({ icon: Icon, heading, body, tags }) => (
            <div
              key={heading}
              className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-colors"
            >
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Icon size={20} className="text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mt-4">{heading}</h3>
              <p className="text-slate-300 text-sm leading-relaxed mt-2">{body}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="bg-white/10 text-slate-300 text-xs font-medium px-3 py-1 rounded-lg"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Step 11 — Testimonials ───────────────────────────────────────── */}
      <section className="bg-white py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-emerald-600 text-xs font-semibold uppercase tracking-widest">
            Reviews
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mt-3">
            From &ldquo;I use three tools for this&rdquo; to
            <br className="hidden sm:block" /> &ldquo;I just use BillingBee.&rdquo;
          </h2>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={15} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-slate-500 text-sm">4.8 / 5 from 247 reviews</span>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* PLACEHOLDER — replace with real reviews before launch */}
          <TestimonialCard
            quote="I used to spend an hour putting together a proposal in Google Docs, email it back and forth, then manually re-enter everything into a separate invoice tool. Now I describe the project, the proposal goes out, the client signs, and the invoice is waiting. Six months in and I haven't opened a spreadsheet once."
            name="Sarah Whitfield"
            role="Freelance Copywriter, London"
          />
          {/* PLACEHOLDER — replace with real reviews before launch */}
          <TestimonialCard
            quote="I stopped writing 'hey, just following up on that invoice' emails the day I turned on the automatic reminders. My clients know there's a system now. They pay faster because they know the next message is coming either way — from the AI, not from me."
            name="Marco Rossi"
            role="Web Developer, Milan"
          />
          {/* PLACEHOLDER — replace with real reviews before launch */}
          <TestimonialCard
            quote="My clients are in the US and Europe. I invoice in USD. I pay taxes in India. BillingBee handles both without me thinking about it. Razorpay payouts, GST-ready PDFs, multi-currency — all built in. No other tool I found did all of this."
            name="Priya Sharma"
            role="UX Designer, Bangalore"
          />
        </div>
      </section>

      {/* ── Step 12 — Pricing ────────────────────────────────────────────── */}
      <section className="bg-slate-50 py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-emerald-600 text-xs font-semibold uppercase tracking-widest">
            Pricing
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mt-3">
            Simple pricing. Real value.
          </h2>
          <p className="text-slate-500 text-lg mt-4">
            Start free — no card, no time limit. Pay when BillingBee earns it.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Free
            </p>
            <div className="mt-2">
              <span className="text-4xl font-bold text-slate-900">$0</span>
              <span className="text-slate-400 text-lg ml-1">/month</span>
            </div>
            <p className="text-slate-500 text-sm mt-1">For getting started.</p>
            <div className="border-t border-slate-100 my-6" />
            <ul className="space-y-3 flex-1">
              {[
                "5 client documents per month",
                "AI proposal & invoice drafting",
                "Client payment links",
                "PDF downloads",
                "Basic tax support",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-slate-600">
                  <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/generate"
              className="mt-8 block text-center py-3 rounded-xl font-semibold text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all duration-200 min-h-[44px] flex items-center justify-center"
            >
              Start free →
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-white rounded-2xl border-2 border-emerald-500 p-8 shadow-lg shadow-emerald-500/10 flex flex-col relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                Most popular
              </span>
            </div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">
              Pro
            </p>
            <div className="mt-2">
              <span className="text-4xl font-bold text-slate-900">$9.99</span>
              <span className="text-slate-400 text-lg ml-1">/month</span>
            </div>
            <p className="text-slate-500 text-sm mt-1">
              For professionals who want the business side handled.
            </p>
            <div className="border-t border-slate-100 my-6" />
            <ul className="space-y-3 flex-1">
              {[
                "Unlimited proposals, contracts & invoices",
                "AI collections — 6 automated follow-ups",
                "Stripe, Razorpay & PayPal payments",
                "AI cashflow forecast + health score",
                "White-label client portal",
                "Full financial reports & exports",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-slate-700">
                  <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/register?trial=pro"
              className="mt-8 block text-center py-3 rounded-xl font-semibold text-sm bg-emerald-500 hover:bg-emerald-600 text-white transition-all duration-200 active:scale-[0.98] min-h-[44px] flex items-center justify-center"
            >
              Start 14-day free trial →
            </Link>
          </div>
        </div>

        <p className="text-center mt-8">
          <Link
            href="/plans-price"
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
          >
            See full plan comparison →
          </Link>
        </p>
      </section>

      {/* ── Step 13 — Final CTA ──────────────────────────────────────────── */}
      <section className="bg-[#1e2330] py-32 px-4 relative overflow-hidden">
        {/* Same background pattern as hero */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(16,185,129,0.12) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-[1.1]">
            <span className="block">Your first proposal takes</span>
            <span className="block text-emerald-400">30 seconds. It&apos;s free.</span>
          </h2>
          <p className="text-lg text-slate-300 mt-6">
            Join 7,000+ professionals running the business side of their craft on
            BillingBee.
          </p>
          <Link
            href="/register"
            className="mt-10 inline-flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all duration-200 active:scale-[0.98] ring-2 ring-emerald-500/20 ring-offset-2 ring-offset-[#1e2330] animate-pulse"
          >
            Start for free — no card required →
          </Link>

          {/* Repeated demo widget */}
          <DemoWidget />
          <p className="text-xs text-slate-500 mt-3">
            Or{" "}
            <Link href="/register" className="underline hover:text-slate-400 transition-colors">
              sign up and save your work →
            </Link>
          </p>
        </div>
      </section>

      {/* ── Step 14 — Footer ─────────────────────────────────────────────── */}
      <footer className="bg-[#1e2330] border-t border-white/5 pt-16 pb-8 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10 mb-12">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center mb-2">
              <Image src="/logo.png" alt="BillingBee" width={120} height={32} className="object-contain brightness-0 invert" />
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-[200px]">
              AI-powered client revenue platform.
            </p>
            <div className="mt-6 space-y-3">
              <div>
                <Image
                  src="/nvidia-inception.png"
                  alt="NVIDIA Inception Program"
                  width={120}
                  height={40}
                  className="object-contain opacity-60 hover:opacity-90 transition-opacity duration-200"
                />
                <p className="text-xs text-slate-500 mt-1">NVIDIA Inception Program Member</p>
              </div>
              <a
                href="https://play.google.com/store/apps/details?id=com.billingbee"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image src="/google-play-badge.png" alt="Get it on Google Play" width={120} height={36} className="object-contain" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
              Product
            </p>
            <ul className="space-y-3">
              {[
                { href: "/free-invoice-generator", label: "Free Generator" },
                { href: "/free-invoice-resources", label: "Templates" },
                { href: "/plans-price", label: "Pricing" },
                { href: "/faq", label: "FAQ" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
              Company
            </p>
            <ul className="space-y-3">
              {[
                { href: "/contact", label: "Contact" },
                { href: "/privacy-policy", label: "Privacy Policy" },
                { href: "/terms-service", label: "Terms of Service" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
              Connect
            </p>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://twitter.com/billing_bee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-500 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.74-8.855L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Twitter / X
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/company/billingbee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-500 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/BillingBee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-500 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@billingbee.co"
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-500 transition-colors"
                >
                  <Mail size={14} />
                  hello@billingbee.co
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} BillingBee. All rights reserved.
          </p>
          <p className="text-xs text-slate-600 text-center">
            © {new Date().getFullYear()} NVIDIA, the NVIDIA logo, and Inception are
            trademarks of NVIDIA Corporation.
          </p>
        </div>
      </footer>

    </div>
  )
}
