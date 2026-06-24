import type { Metadata } from "next"
import Link from "next/link"
import { generatePageMetadata } from "@/lib/metadata"
import { Calculator, Clock, ArrowRight, CalendarClock, TrendingUp } from "lucide-react"

export const metadata: Metadata = {
  ...generatePageMetadata(
    "Free Tools for Freelancers & Small Businesses | BillingBee",
    "Free calculators and tools for freelancers and small businesses. Calculate GST, find your minimum hourly rate, and more. No signup required.",
    "/tools",
    {
      keywords: [
        "free tools freelancers",
        "GST calculator India",
        "freelancer rate calculator",
        "small business tools",
        "invoice tools free",
      ],
    }
  ),
  alternates: {
    canonical: "https://www.billingbee.co/tools",
  },
}

const liveTools = [
  {
    href: "/tools/gst-calculator",
    icon: Calculator,
    title: "GST Calculator",
    description:
      "Add or remove GST from any amount instantly. Supports 5%, 12%, 18%, and 28% rates with CGST/SGST split.",
    badge: null,
  },
  {
    href: "/tools/freelancer-rate-calculator",
    icon: TrendingUp,
    title: "Freelancer Rate Calculator",
    description:
      "Find your minimum hourly rate based on your income goal, hours, overhead costs, and vacation time.",
    badge: null,
  },
  {
    href: "/tools/late-payment-calculator",
    icon: Clock,
    title: "Late Payment Interest Calculator",
    description: "Calculate interest on overdue invoices. Enter the overdue amount, due date, and interest rate.",
    badge: null,
  },
  {
    href: "/tools/invoice-due-date-calculator",
    icon: CalendarClock,
    title: "Invoice Due Date Calculator",
    description: "Calculate invoice due dates from issue date with Net-15, Net-30, Net-60 and custom payment terms.",
    badge: null,
  },
]


export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-emerald-500">BillingBee</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors active:scale-95"
            >
              Get started free
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Free Tools for Freelancers &amp; Small Businesses
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Handy calculators to help you price your work, manage taxes, and run your business smarter.
            No signup required.
          </p>
        </div>

        {/* Live tools */}
        <section className="mb-12">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Available now</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveTools.map((tool) => {
              const Icon = tool.icon
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6 group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                          {tool.title}
                        </h3>
                      </div>
                      <p className="text-sm text-slate-500 leading-relaxed">{tool.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* CTA */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Ready to send professional invoices?</h2>
          <p className="text-slate-500 mb-6">
            BillingBee helps freelancers and small businesses invoice faster with AI, track payments, and get paid
            on time.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-6 py-3 text-sm font-medium transition-colors active:scale-95"
          >
            Create your free account
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-slate-400 mt-3">Free plan available. No credit card required.</p>
        </div>
      </main>
    </div>
  )
}
