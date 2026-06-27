import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { generatePageMetadata } from "@/lib/metadata"
import { BellOff, TrendingDown, FileX, Bot, TrendingUp, FileText, Receipt, CreditCard, Zap } from "lucide-react"

export const metadata: Metadata = {
  ...generatePageMetadata(
    "Zoho Invoice Alternative India — AI-Powered Invoicing with Payment Reminders | BillingBee",
    "Zoho Invoice se better chahiye? BillingBee mein AI payment reminders, proposal-to-invoice workflow, aur Razorpay integration hai — sab free mein. India ke freelancers ke liye.",
    "/zoho-invoice-alternative-india"
  ),
  alternates: {
    canonical: "https://www.billingbee.co/zoho-invoice-alternative-india",
  },
  other: {
    "application/ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Zoho Invoice se BillingBee mein data migrate ho sakta hai?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Abhi direct import nahi hai, lekin clients aur invoices manually add karna 30 minute ka kaam hai. Zyada clients ke liye CSV import coming soon.",
          },
        },
        {
          "@type": "Question",
          name: "BillingBee ka free plan Zoho se better kyun hai?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "BillingBee free plan mein AI payment reminders included hain — Zoho ke free plan mein nahi hain. Zoho free mein 500 invoices/year ki limit bhi hai.",
          },
        },
        {
          "@type": "Question",
          name: "Kya BillingBee mein Zoho jaisi recurring invoices hain?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Haan. BillingBee mein recurring invoices set kar sakte ho — weekly, monthly, quarterly. Automatic send hoti hain.",
          },
        },
        {
          "@type": "Question",
          name: "Razorpay BillingBee mein kaise connect karein?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Settings → Payments → Razorpay mein API key paste karo. 2 minute ka setup. Phir har invoice pe payment link automatic.",
          },
        },
        {
          "@type": "Question",
          name: "Kya BillingBee mein client portal hai?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Haan. Client apna portal dekh sakta hai — invoices, payment history, aur Pay Now button.",
          },
        },
        {
          "@type": "Question",
          name: "BillingBee ka Pro plan kitne ka hai?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "₹849/month (India). Unlimited invoices, AI collections, Stripe + Razorpay, no watermark. Free plan mein 5 invoices/month milti hain.",
          },
        },
      ],
    }),
  },
}

const LIMITATIONS = [
  {
    Icon: BellOff,
    title: "AI Payment Reminders nahi",
    body: "Zoho mein manually reminder bhejni padti hai. Client late kare toh aap chase karo — Zoho nahi.",
  },
  {
    Icon: TrendingDown,
    title: "Revenue Forecast nahi",
    body: "Zoho mein future income predict karne ka koi AI tool nahi hai. Cash flow planning manually karni padti hai.",
  },
  {
    Icon: FileX,
    title: "Proposal + Contract workflow nahi",
    body: "Zoho Invoice mein sirf invoice hai. Proposal banana, contract sign karana — alag tools chahiye.",
  },
]

const STEPS = [
  { n: "1", title: "Invoice bhejo", desc: "GST auto-calculate, professional template, Razorpay payment link included." },
  { n: "2", title: "BillingBee track karta hai", desc: "Client ne invoice khola ya nahi — sab dikhta hai dashboard mein." },
  { n: "3", title: "AI follow-up karta hai", desc: "Day 3, 7, 14 pe automatic polite reminder — aap kuch nahi karte." },
  { n: "4", title: "Payment aate hi PAID", desc: "Razorpay webhook se invoice automatically update hota hai." },
]

const FEATURES = [
  { Icon: Bot, name: "AI Payment Reminders", desc: "Automatic Day 3/7/14 follow-up — Zoho mein nahi hai" },
  { Icon: TrendingUp, name: "AI Revenue Forecast", desc: "Agla mahina kaisa rahega — Zoho mein nahi hai" },
  { Icon: FileText, name: "Proposal → Contract → Invoice", desc: "Poora workflow ek jagah — Zoho mein teen alag tools" },
  { Icon: Receipt, name: "GST Invoice", desc: "CGST/SGST/IGST auto-calculate — dono mein hai" },
  { Icon: CreditCard, name: "Razorpay Integration", desc: "UPI, card, net banking — dono mein hai" },
  { Icon: Zap, name: "Simple Onboarding", desc: "5 minute mein first invoice — Zoho se simpler" },
]

const COMPARISON = [
  { feature: "AI Payment Reminders", bb: true, zoho: false },
  { feature: "AI Revenue Forecast", bb: true, zoho: false },
  { feature: "Proposal + Contract", bb: true, zoho: false },
  { feature: "GST Invoice", bb: true, zoho: true },
  { feature: "Razorpay Integration", bb: true, zoho: true },
  { feature: "Free Plan", bb: true, zoho: true },
]

const FAQS = [
  {
    q: "Zoho Invoice se BillingBee mein data migrate ho sakta hai?",
    a: "Abhi direct import nahi hai, lekin clients aur invoices manually add karna 30 minute ka kaam hai. Zyada clients ke liye CSV import coming soon.",
  },
  {
    q: "BillingBee ka free plan Zoho se better kyun hai?",
    a: "BillingBee free plan mein AI payment reminders included hain — Zoho ke free plan mein nahi hain. Zoho free mein 500 invoices/year ki limit bhi hai.",
  },
  {
    q: "Kya BillingBee mein Zoho jaisi recurring invoices hain?",
    a: "Haan. BillingBee mein recurring invoices set kar sakte ho — weekly, monthly, quarterly. Automatic send hoti hain.",
  },
  {
    q: "Razorpay BillingBee mein kaise connect karein?",
    a: "Settings → Payments → Razorpay mein API key paste karo. 2 minute ka setup. Phir har invoice pe payment link automatic.",
  },
  {
    q: "Kya BillingBee mein client portal hai?",
    a: "Haan. Client apna portal dekh sakta hai — invoices, payment history, aur Pay Now button.",
  },
  {
    q: "BillingBee ka Pro plan kitne ka hai?",
    a: "₹849/month (India). Unlimited invoices, AI collections, Stripe + Razorpay, no watermark. Free plan mein 5 invoices/month milti hain.",
  },
]

export default function ZohoAlternativePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* NAV */}
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" alt="BillingBee" width={140} height={32} className="brightness-0" />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-slate-600 font-medium hover:text-slate-900 transition-all duration-150"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-all duration-150 active:scale-95"
            >
              Start Free
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="bg-white py-12 md:py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <span className="inline-block bg-slate-100 text-slate-700 rounded-full px-3 py-1 text-sm font-medium">
              Zoho Invoice se switch kar rahe hain?
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mt-4 leading-tight">
              Zoho Invoice Free Hai —
              <br />
              Lekin Client Chase Aapko Karna Padta Hai
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto mt-4 leading-relaxed">
              Zoho mein AI payment reminders nahi hain. BillingBee mein hai.
              Invoice bhejo — BillingBee khud Day 3, Day 7, Day 14 pe follow-up karta hai.
              Aapko ek bhi awkward message nahi karna.
            </p>
            <div className="mt-8 flex gap-4 justify-center flex-wrap">
              <Link
                href="/register"
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-150 active:scale-95"
              >
                Free mein try karo →
              </Link>
              <Link
                href="#comparison"
                className="text-slate-600 underline font-medium transition-all duration-150 hover:text-slate-900 flex items-center"
              >
                BillingBee vs Zoho compare karo
              </Link>
            </div>
            <div className="mt-6 flex gap-6 justify-center flex-wrap text-sm text-slate-400">
              <span>✓ Free plan available</span>
              <span>✓ AI payment reminders</span>
              <span>✓ GST compliant</span>
              <span>✓ Razorpay ready</span>
            </div>
          </div>
        </section>

        {/* ZOHO KI LIMITATIONS */}
        <section className="bg-slate-50 py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-slate-900 text-center">
              Zoho Invoice mein kya nahi hai?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
              {LIMITATIONS.map(({ Icon, title, body }) => (
                <div key={title} className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
                  <Icon size={24} className="text-slate-400" />
                  <h3 className="font-semibold text-slate-900 mt-3">{title}</h3>
                  <p className="text-slate-500 mt-2 text-sm leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="bg-white py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-slate-900 text-center">
              BillingBee woh karta hai jo Zoho nahi karta
            </h2>
            <div className="flex flex-col md:flex-row gap-8 mt-10 items-start">
              {STEPS.map(({ n, title, desc }, i) => (
                <div key={n} className="flex-1 flex flex-col md:items-center md:text-center">
                  <div className="flex md:flex-col md:items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center shrink-0">
                      {n}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{title}</h3>
                      <p className="text-slate-500 text-sm mt-1 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="hidden md:block w-full border-t border-slate-200 mt-5" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURE GRID */}
        <section className="bg-slate-50 py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-slate-900 text-center">
              Sirf Zoho se better nahi — genuinely smarter
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mt-10">
              {FEATURES.map(({ Icon, name, desc }) => (
                <div key={name} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                  <Icon size={24} className="text-emerald-500" />
                  <h3 className="font-semibold text-slate-900 mt-3 text-sm">{name}</h3>
                  <p className="text-slate-500 text-sm mt-1 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COMPARISON TABLE */}
        <section id="comparison" className="bg-white py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-slate-900 text-center">
              BillingBee vs Zoho Invoice — honest comparison
            </h2>
            <p className="text-slate-500 text-center mt-2">
              Dono tools ke features side by side
            </p>
            <div className="mt-10 overflow-x-auto">
              <table className="w-full max-w-2xl mx-auto text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-slate-600 font-semibold">Feature</th>
                    <th className="py-3 px-4 bg-emerald-50 text-emerald-700 font-semibold rounded-t-lg">
                      BillingBee
                    </th>
                    <th className="py-3 px-4 text-slate-600 font-semibold">Zoho Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map(({ feature, bb, zoho }, i) => (
                    <tr key={feature} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="py-3 px-4 text-slate-700">{feature}</td>
                      <td className="py-3 px-4 text-center bg-emerald-50">
                        <span className={bb ? "text-emerald-500 font-semibold" : "text-slate-300"}>
                          {bb ? "✅" : "❌"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={zoho ? "text-emerald-500 font-semibold" : "text-slate-300"}>
                          {zoho ? "✅" : "❌"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-slate-400 text-xs text-center mt-4">
                * Zoho Invoice free plan mein 500 invoices/year ki limit hai
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-slate-50 py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-slate-900 text-center">
              Zoho se BillingBee pe switch karna easy hai?
            </h2>
            <div className="max-w-3xl mx-auto mt-10 space-y-6">
              {FAQS.map(({ q, a }, i) => (
                <div key={q} className={i < FAQS.length - 1 ? "border-b border-slate-200 pb-6" : ""}>
                  <h3 className="font-semibold text-slate-900 text-base">{q}</h3>
                  <p className="text-slate-600 text-sm mt-1 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="bg-emerald-600 py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white">Zoho se zyada smart tool try karo</h2>
            <p className="text-emerald-100 mt-3">
              AI payment reminders. Revenue forecast. Poora freelancer workflow. Free mein.
            </p>
            <Link
              href="/register"
              className="inline-block mt-8 bg-white text-emerald-700 px-8 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-all duration-150 active:scale-95"
            >
              Free Account Banao →
            </Link>
            <p className="mt-4 text-emerald-200 text-sm">
              No credit card · Cancel anytime · GST ready
            </p>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm">
        <p>
          © 2026 BillingBee Inc. ·{" "}
          <Link href="/privacy-policy" className="hover:text-slate-200 transition-all duration-150">
            Privacy Policy
          </Link>{" "}
          ·{" "}
          <Link href="/terms-service" className="hover:text-slate-200 transition-all duration-150">
            Terms of Service
          </Link>
        </p>
      </footer>
    </div>
  )
}
