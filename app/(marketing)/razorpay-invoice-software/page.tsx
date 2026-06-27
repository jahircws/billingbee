import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { generatePageMetadata } from "@/lib/metadata"
import { Link as LinkIcon, Smartphone, CheckCircle, Zap, Bot, Receipt, FileText, Bell, TrendingUp } from "lucide-react"

export const metadata: Metadata = {
  ...generatePageMetadata(
    "Razorpay Invoice Software — Accept UPI, Cards & Net Banking | BillingBee",
    "Razorpay ko BillingBee se connect karo. Invoice bhejo, client directly UPI, card ya net banking se pay kare. GST compliant. AI payment reminders included. Free mein shuru karo.",
    "/razorpay-invoice-software"
  ),
  alternates: {
    canonical: "https://www.billingbee.co/razorpay-invoice-software",
  },
  other: {
    "application/ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Razorpay BillingBee se kaise connect karein?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "BillingBee dashboard mein Settings → Payments → Razorpay jaao. Apni Razorpay API Key aur Secret daalo. Save karo — bas, connected.",
          },
        },
        {
          "@type": "Question",
          name: "Kaunse payment methods support hote hain?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "UPI (GPay, PhonePe, Paytm, BHIM), credit cards, debit cards, aur 50+ banks ka net banking — sab Razorpay ke through available hai.",
          },
        },
        {
          "@type": "Question",
          name: "Client pay kare toh invoice automatically PAID hota hai?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Haan. Razorpay webhook se BillingBee ko instant notification milta hai. Invoice status automatically PAID update hota hai — aapko kuch karna nahi.",
          },
        },
        {
          "@type": "Question",
          name: "Kya free plan mein Razorpay use kar sakte hain?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Haan. Free plan mein Razorpay integration available hai. Pro plan mein Stripe bhi add ho jaata hai international clients ke liye.",
          },
        },
        {
          "@type": "Question",
          name: "Razorpay ke transaction charges kya hain?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Razorpay ke standard charges apply hote hain — domestic UPI/cards pe 1.75-2%. BillingBee ki taraf se koi extra charge nahi.",
          },
        },
        {
          "@type": "Question",
          name: "Kya invoice PDF mein bhi payment link hota hai?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Haan. Invoice PDF mein payment link automatically included hota hai taaki client email se bhi pay kar sake.",
          },
        },
      ],
    }),
  },
}

const CLIENT_CARDS = [
  {
    Icon: LinkIcon,
    title: "Payment link invoice mein",
    body: "Client email kholta hai — 'Pay Now' button seedha dikhai deta hai. Koi extra step nahi.",
  },
  {
    Icon: Smartphone,
    title: "UPI, Card, Net Banking",
    body: "GPay, PhonePe, Paytm, credit/debit card, 50+ banks — client jo prefer kare woh use kare.",
  },
  {
    Icon: CheckCircle,
    title: "Payment hote hi PAID",
    body: "Razorpay webhook se invoice automatically PAID mark hota hai. Aapko manually update nahi karna.",
  },
]

const STEPS = [
  { n: "1", title: "BillingBee mein register karo", desc: "Free account, koi credit card nahi." },
  { n: "2", title: "Razorpay keys add karo", desc: "Settings → Payments → Razorpay API key paste karo." },
  { n: "3", title: "Invoice banao aur bhejo", desc: "Client ko email jaata hai payment link ke saath." },
  { n: "4", title: "Payment aate hi done", desc: "Invoice PAID, aapko notification, client ko receipt." },
]

const FEATURES = [
  { Icon: Zap, name: "Razorpay Integration", desc: "UPI, cards, net banking — sab ek jagah" },
  { Icon: Bot, name: "AI Payment Reminders", desc: "Client late kare toh AI automatically chase karta hai" },
  { Icon: Receipt, name: "GST Invoice", desc: "CGST/SGST/IGST auto-calculate" },
  { Icon: FileText, name: "Proposal → Contract → Invoice", desc: "Poora workflow ek hi tool mein" },
  { Icon: Bell, name: "Payment Notifications", desc: "Payment hote hi email aata hai aapko" },
  { Icon: TrendingUp, name: "AI Revenue Forecast", desc: "Agla mahina kaisa rahega, AI batata hai" },
]

const COMPARISON = [
  { feature: "Razorpay Integration", bb: true, zoho: true, vyapar: true },
  { feature: "AI Payment Reminders", bb: true, zoho: false, vyapar: false },
  { feature: "Proposal + Contract", bb: true, zoho: false, vyapar: false },
  { feature: "AI Revenue Forecast", bb: true, zoho: false, vyapar: false },
  { feature: "GST Invoice", bb: true, zoho: true, vyapar: true },
]

const FAQS = [
  {
    q: "Razorpay BillingBee se kaise connect karein?",
    a: "BillingBee dashboard mein Settings → Payments → Razorpay jaao. Apni Razorpay API Key aur Secret daalo. Save karo — bas, connected.",
  },
  {
    q: "Kaunse payment methods support hote hain?",
    a: "UPI (GPay, PhonePe, Paytm, BHIM), credit cards, debit cards, aur 50+ banks ka net banking — sab Razorpay ke through available hai.",
  },
  {
    q: "Client pay kare toh invoice automatically PAID hota hai?",
    a: "Haan. Razorpay webhook se BillingBee ko instant notification milta hai. Invoice status automatically PAID update hota hai — aapko kuch karna nahi.",
  },
  {
    q: "Kya free plan mein Razorpay use kar sakte hain?",
    a: "Haan. Free plan mein Razorpay integration available hai. Pro plan mein Stripe bhi add ho jaata hai international clients ke liye.",
  },
  {
    q: "Razorpay ke transaction charges kya hain?",
    a: "Razorpay ke standard charges apply hote hain — domestic UPI/cards pe 1.75-2%. BillingBee ki taraf se koi extra charge nahi.",
  },
  {
    q: "Kya invoice PDF mein bhi payment link hota hai?",
    a: "Haan. Invoice PDF mein payment link automatically included hota hai taaki client email se bhi pay kar sake.",
  },
]

export default function RazorpayInvoiceSoftwarePage() {
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
            <span className="inline-block bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm font-medium">
              ⚡ Razorpay + BillingBee
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mt-4 leading-tight">
              Razorpay Se Invoice Karo
              <br />
              Client Ko Link Bhejo — Wo Pay Kare
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto mt-4 leading-relaxed">
              BillingBee mein Razorpay connect karo. Invoice bhejo — client UPI, card,
              ya net banking se seedha pay kar sakta hai. Payment hote hi invoice
              automatically PAID ho jaata hai.
            </p>
            <div className="mt-8 flex gap-4 justify-center flex-wrap">
              <Link
                href="/register"
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-150 active:scale-95"
              >
                Free mein connect karo →
              </Link>
              <Link
                href="#how-it-works"
                className="text-slate-600 underline font-medium transition-all duration-150 hover:text-slate-900 flex items-center"
              >
                Razorpay kaise connect karein?
              </Link>
            </div>
            <div className="mt-6 flex gap-6 justify-center flex-wrap text-sm text-slate-400">
              <span>✓ 2 minute setup</span>
              <span>✓ UPI + Cards + Net Banking</span>
              <span>✓ Auto PAID status</span>
              <span>✓ GST compliant</span>
            </div>
          </div>
        </section>

        {/* WHAT CLIENT SEES */}
        <section className="bg-slate-50 py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-slate-900 text-center">
              Client ko kya milta hai?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
              {CLIENT_CARDS.map(({ Icon, title, body }) => (
                <div
                  key={title}
                  className="bg-white rounded-xl shadow-sm p-6 border border-slate-100"
                >
                  <Icon size={24} className="text-emerald-500" />
                  <h3 className="font-semibold text-slate-900 mt-3">{title}</h3>
                  <p className="text-slate-500 mt-2 text-sm leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="bg-white py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-slate-900 text-center">
              Setup — sirf 2 minute
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
              Sirf Razorpay nahi — poora invoicing system
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mt-10">
              {FEATURES.map(({ Icon, name, desc }) => (
                <div
                  key={name}
                  className="bg-white rounded-xl p-5 shadow-sm border border-slate-100"
                >
                  <Icon size={24} className="text-emerald-500" />
                  <h3 className="font-semibold text-slate-900 mt-3 text-sm">{name}</h3>
                  <p className="text-slate-500 text-sm mt-1 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COMPARISON TABLE */}
        <section className="bg-white py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-slate-900 text-center">
              Razorpay invoicing options compare karo
            </h2>
            <p className="text-slate-500 text-center mt-2">
              Sirf Razorpay integration wale tools
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
                    <th className="py-3 px-4 text-slate-600 font-semibold">Vyapar</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map(({ feature, bb, zoho, vyapar }, i) => (
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
                      <td className="py-3 px-4 text-center">
                        <span className={vyapar ? "text-emerald-500 font-semibold" : "text-slate-300"}>
                          {vyapar ? "✅" : "❌"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-slate-50 py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-slate-900 text-center">
              Aksar pooche jaane wale sawaal
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
            <h2 className="text-3xl font-bold text-white">Razorpay aaj connect karo</h2>
            <p className="text-emerald-100 mt-3">2 minute setup. Pehla payment aaj hi lo.</p>
            <Link
              href="/register"
              className="inline-block mt-8 bg-white text-emerald-700 px-8 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-all duration-150 active:scale-95"
            >
              Free Account Banao →
            </Link>
            <p className="mt-4 text-emerald-200 text-sm">
              No credit card · Razorpay ready · GST compliant
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
