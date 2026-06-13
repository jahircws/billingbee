import Link from "next/link"
import {
  Zap,
  FileText,
  CreditCard,
  Users,
  BarChart3,
  Shield,
  ArrowRight,
  Check,
  Globe,
  Sparkles,
  Star,
  Mail,
  TrendingUp,
  MessageSquare,
} from "lucide-react"

// ── Feature bento cards ───────────────────────────────────────────────────────

function BentoCard({
  icon: Icon,
  title,
  description,
  className = "",
  children,
}: {
  icon: React.ElementType
  title: string
  description: string
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div
      className={`group relative bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-200 overflow-hidden ${className}`}
    >
      <div className="relative z-10">
        <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
          <Icon size={18} className="text-emerald-600" />
        </div>
        <h3 className="font-semibold text-slate-900 mb-1.5 text-sm">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
        {children && <div className="mt-4">{children}</div>}
      </div>
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
    <div className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md transition-all duration-200">
      <div className="flex gap-0.5 mb-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
        ))}
      </div>
      <p className="text-sm text-slate-600 leading-relaxed mb-4">&ldquo;{quote}&rdquo;</p>
      <div>
        <p className="text-sm font-semibold text-slate-900">{name}</p>
        <p className="text-xs text-slate-400">{role}</p>
      </div>
    </div>
  )
}

// ── Mini UI previews inside bento cards ──────────────────────────────────────

function MiniChatBubble() {
  return (
    <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-100">
      <div className="flex items-start gap-2">
        <div className="w-5 h-5 rounded-full bg-slate-300 shrink-0 mt-0.5" />
        <div className="bg-slate-200 rounded-lg rounded-tl-none px-3 py-1.5 text-xs text-slate-600 max-w-[80%]">
          Invoice Acme Corp $2,500 for design work
        </div>
      </div>
      <div className="flex items-start gap-2 justify-end">
        <div className="bg-emerald-600 rounded-lg rounded-tr-none px-3 py-1.5 text-xs text-white max-w-[80%]">
          ✓ Invoice #INV-042 created — due in 14 days
        </div>
        <div className="w-5 h-5 rounded-full bg-emerald-200 shrink-0 mt-0.5 flex items-center justify-center">
          <Zap size={10} className="text-emerald-700" />
        </div>
      </div>
    </div>
  )
}

function MiniBarChart() {
  const bars = [65, 40, 80, 55, 90, 70, 95]
  return (
    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
      <p className="text-xs text-slate-400 mb-2 font-medium">Next 30 days — est. $8,400</p>
      <div className="flex items-end gap-1 h-10">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-emerald-500 rounded-sm opacity-80"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  )
}

function MiniInvoiceRow() {
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
      <div className="px-3 py-2 flex items-center justify-between text-xs border-b border-slate-100">
        <span className="text-slate-400 font-medium">INV-041</span>
        <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">Due in 3d</span>
      </div>
      <div className="px-3 py-2 flex items-center justify-between text-xs border-b border-slate-100">
        <span className="text-slate-400 font-medium">INV-040</span>
        <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-medium">Paid</span>
      </div>
      <div className="px-3 py-2 flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium">INV-039</span>
        <span className="bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-medium">Overdue</span>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomepageNewPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold text-slate-900">BillingBee</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-500">
            <Link href="/plans-price" className="hover:text-slate-900 transition-colors">Pricing</Link>
            <Link href="/free-invoice-generator" className="hover:text-slate-900 transition-colors">Free Tools</Link>
            <Link href="/faq" className="hover:text-slate-900 transition-colors">FAQ</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-500 hover:text-slate-900 transition-colors hidden sm:block">
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition-all active:scale-95 min-h-[36px] flex items-center"
            >
              Try free →
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-[#1e2330] min-h-screen flex flex-col items-center justify-center text-center px-4 py-24 relative overflow-hidden">
        {/* Subtle radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(16,185,129,0.12) 0%, transparent 70%)",
          }}
        />
        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, #10b981 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-4 py-1.5 rounded-full border border-emerald-500/20 mb-8 tracking-widest uppercase">
            <Sparkles size={11} />
            Powered by AI · NVIDIA Inception Member
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.05] mb-6">
            Your AI invoicing
            <br />
            <span className="text-emerald-400">assistant.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-xl mx-auto mb-10 leading-relaxed">
            Say &ldquo;Invoice Acme Corp $2,500 for design work&rdquo; — BillingBee creates a
            polished, tax-ready invoice, sends it, and follows up automatically.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <Link
              href="/generate"
              className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-4 rounded-2xl text-base transition-all active:scale-95 shadow-lg shadow-emerald-900/40 min-h-[52px]"
            >
              Create your first invoice free
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/plans-price"
              className="inline-flex items-center justify-center gap-2 bg-transparent hover:bg-white/5 text-white border border-white/20 font-semibold px-8 py-4 rounded-2xl text-base transition-all active:scale-95 min-h-[52px]"
            >
              See pricing
            </Link>
          </div>

          <p className="text-sm text-slate-400">
            7,000+ invoices created · Free to start · No credit card required
          </p>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section className="border-y border-slate-100 bg-white py-5">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/badges/nvidia-inception-program-badge.svg"
            alt="NVIDIA Inception program member"
            className="grayscale hover:grayscale-0 transition-all duration-300"
            style={{ width: 140, height: "auto" }}
          />
          <div className="h-px sm:h-8 w-16 sm:w-px bg-slate-200" />
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
              <span className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{rating}</span> on {source}
              </span>
            </div>
          ))}
          <div className="h-px sm:h-8 w-16 sm:w-px bg-slate-200" />
          <span className="text-sm text-slate-500 font-medium">Stripe · Razorpay · PayPal</span>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-slate-50 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight mb-4">
              From first pitch to final payment
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto">
              No forms. No spreadsheets. No juggling three separate tools.
            </p>
          </div>

          <div className="relative">
            {/* Connector line — desktop only */}
            <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-px border-t-2 border-dashed border-emerald-200 z-0" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              {[
                {
                  step: "01",
                  icon: FileText,
                  title: "Win the work",
                  desc: "Describe the project — AI writes a professional proposal. Client signs in their portal.",
                },
                {
                  step: "02",
                  icon: Zap,
                  title: "Invoice in 30 seconds",
                  desc: "\"Invoice TechCorp $5,000 for web dev, due in 15 days\" — AI fills everything.",
                },
                {
                  step: "03",
                  icon: CreditCard,
                  title: "Get paid & know what's next",
                  desc: "Client pays via card, UPI, or PayPal. AI forecasts your next month's revenue.",
                },
              ].map(({ step, icon: Icon, title, desc }) => (
                <div key={step} className="flex flex-col items-center text-center">
                  <div className="relative mb-5">
                    <span className="text-8xl font-bold text-emerald-100 leading-none select-none absolute -top-4 left-1/2 -translate-x-1/2">
                      {step}
                    </span>
                    <div className="relative z-10 w-16 h-16 bg-white border-2 border-emerald-200 rounded-2xl flex items-center justify-center shadow-sm">
                      <Icon size={24} className="text-emerald-600" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-[220px]">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features bento ── */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight mb-4">
              Everything you need to get paid
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto">
              From first pitch to final payment — all in one place, powered by AI.
            </p>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">

            {/* Large card — AI invoicing (col-span-2) */}
            <BentoCard
              icon={MessageSquare}
              title="Natural language invoicing"
              description="Just describe what you did. AI fills in client details, amounts, taxes, and due dates — in seconds."
              className="lg:col-span-2"
            >
              <MiniChatBubble />
            </BentoCard>

            {/* Payments */}
            <BentoCard
              icon={CreditCard}
              title="Payment links everywhere"
              description="Accept cards, UPI, wallets, and bank transfers via Stripe, Razorpay, or PayPal. One link works worldwide."
            >
              <div className="flex flex-wrap gap-2 mt-1">
                {["Stripe", "Razorpay", "PayPal"].map((p) => (
                  <span key={p} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-medium">
                    {p}
                  </span>
                ))}
              </div>
            </BentoCard>

            {/* Collections */}
            <BentoCard
              icon={Users}
              title="Automated collections"
              description="AI sends polite reminders at 7, 3, and 1 day before due — and escalates overdue invoices automatically."
            >
              <MiniInvoiceRow />
            </BentoCard>

            {/* Cashflow — large (col-span-2) */}
            <BentoCard
              icon={TrendingUp}
              title="AI cashflow forecast"
              description="Claude analyses 12 months of payment history, names your late-paying clients, and tells you what to expect next month — in plain English."
              className="lg:col-span-2"
            >
              <MiniBarChart />
            </BentoCard>

            {/* Proposals */}
            <BentoCard
              icon={FileText}
              title="AI proposal generator"
              description="Describe the project, AI writes the proposal. Client accepts in the portal and it converts to an invoice."
            />

            {/* Client portal */}
            <BentoCard
              icon={Shield}
              title="Client portal"
              description="Clients view invoices, download PDFs, and pay — no account needed. Fully white-labelled."
            />

            {/* Global */}
            <BentoCard
              icon={Globe}
              title="Built for India, works everywhere"
              description="GST-compliant invoices, Razorpay and UPI support, INR billing. Plus 100+ currencies for international clients."
            />
          </div>
        </div>
      </section>

      {/* ── Works everywhere ── */}
      <section className="bg-[#1e2330] py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-4">Global payments</p>
          <h2 className="text-3xl md:text-4xl font-semibold text-white tracking-tight mb-5">
            Your clients are global.
            <br className="hidden sm:block" /> Your invoicing should be too.
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto mb-10 text-lg leading-relaxed">
            Send invoices in USD, EUR, GBP, INR, or 100+ currencies. Accept payments via Stripe,
            Razorpay, or PayPal. BillingBee handles the currency — you handle the work.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { icon: Globe, label: "100+ currencies" },
              { icon: CreditCard, label: "Stripe · Razorpay · PayPal" },
              { icon: Check, label: "GST-ready for India" },
              { icon: Zap, label: "UPI support" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="inline-flex items-center gap-2 bg-white/8 hover:bg-white/12 text-white px-4 py-2.5 rounded-full border border-white/10 transition-colors text-sm">
                <Icon size={14} className="text-emerald-400" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-slate-50 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">Reviews</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight mb-3">
              Loved by freelancers worldwide
            </h2>
            <div className="flex items-center justify-center gap-1 mb-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={15} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-sm text-slate-400">4.8 / 5 from 247 reviews</p>
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
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight mb-3">
              Simple pricing. Free to start.
            </h2>
            <p className="text-slate-500">No credit card required. No time limit on the free plan.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Free */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col">
              <div className="mb-5">
                <h3 className="text-lg font-semibold text-slate-900">Free</h3>
                <p className="text-sm text-slate-500 mt-1">Perfect for getting started.</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">$0</span>
                <span className="text-slate-400 ml-1 text-sm">/month</span>
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {[
                  "5 invoices/month",
                  "AI invoice creation",
                  "PDF downloads",
                  "Basic tax support",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-slate-700">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/generate"
                className="text-center py-3 rounded-xl font-semibold text-sm border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors min-h-[44px] flex items-center justify-center"
              >
                Start free →
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-white rounded-2xl border-2 border-emerald-500 shadow-xl shadow-emerald-100 p-8 flex flex-col relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                  Most popular
                </span>
              </div>
              <div className="mb-5">
                <h3 className="text-lg font-semibold text-slate-900">Pro</h3>
                <p className="text-sm text-slate-500 mt-1">Everything you need to get paid.</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">$9.99</span>
                <span className="text-slate-400 ml-1 text-sm">/month</span>
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {[
                  "Unlimited invoices",
                  "AI collections & reminders",
                  "Payment links (Stripe, Razorpay, PayPal)",
                  "AI cashflow forecast",
                  "AI proposal generator",
                  "White-label client portal",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-slate-700">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register?trial=pro"
                className="text-center py-3 rounded-xl font-semibold text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition-colors min-h-[44px] flex items-center justify-center"
              >
                Start 14-day trial →
              </Link>
            </div>
          </div>

          <p className="text-center text-sm text-slate-400 mt-6">
            <Link href="/plans-price" className="underline hover:text-slate-600 transition-colors">
              See full plan details →
            </Link>
          </p>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-[#1e2330] py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-5">
            Your first invoice takes
            <br />
            30 seconds. It&apos;s free.
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
            5 invoices/month, AI invoice creation, automatic tax. No credit card. No time limit.
          </p>
          <Link
            href="/generate"
            className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-10 py-4 rounded-2xl text-base transition-all active:scale-95 min-h-[52px] shadow-lg shadow-emerald-900/40"
            style={{
              animation: "cta-pulse 2.5s ease-in-out infinite",
            }}
          >
            Create your first invoice free
            <ArrowRight size={16} />
          </Link>
          <style>{`
            @keyframes cta-pulse {
              0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.35), 0 10px 40px rgba(16, 185, 129, 0.25); }
              50% { box-shadow: 0 0 0 12px rgba(16, 185, 129, 0), 0 10px 40px rgba(16, 185, 129, 0.4); }
            }
          `}</style>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#1e2330] border-t border-white/5 py-14 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Zap size={14} className="text-white" />
              </div>
              <span className="font-bold text-white">BillingBee</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mb-4 max-w-[200px]">
              AI invoicing for freelancers everywhere.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/badges/nvidia-inception-program-badge.svg"
              alt="NVIDIA Inception program member"
              className="opacity-60 hover:opacity-90 transition-opacity"
              style={{ width: 110, height: "auto" }}
            />
          </div>

          {/* Product */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Product</p>
            <ul className="space-y-3 text-sm text-slate-400">
              {[
                { href: "/generate", label: "Free Invoice Generator" },
                { href: "/free-invoice-resources", label: "Templates" },
                { href: "/plans-price", label: "Pricing" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Company</p>
            <ul className="space-y-3 text-sm text-slate-400">
              {[
                { href: "/faq", label: "FAQ" },
                { href: "/contact", label: "Contact" },
                { href: "/privacy-policy", label: "Privacy" },
                { href: "/terms-service", label: "Terms" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Connect</p>
            <div className="flex flex-col gap-3">
              <Link
                href="https://twitter.com/billingbeeapp"
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.74-8.855L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Twitter / X
              </Link>
              <Link
                href="/contact"
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <Mail size={14} />
                hello@billingbee.co
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} BillingBee. All rights reserved.</p>
          <p className="text-center">
            © {new Date().getFullYear()} NVIDIA, the NVIDIA logo, and NVIDIA Inception are trademarks of NVIDIA Corporation.
          </p>
        </div>
      </footer>
    </div>
  )
}
