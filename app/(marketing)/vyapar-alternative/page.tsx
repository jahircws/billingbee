import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { generatePageMetadata } from "@/lib/metadata"
import { Bot, FileText, TrendingUp, Receipt, CreditCard, Globe } from "lucide-react"

export const metadata: Metadata = {
  ...generatePageMetadata(
    "Vyapar Alternative for Freelancers India — AI Invoicing with Payment Reminders | BillingBee",
    "Vyapar shop owners ke liye hai. Freelancers ke liye BillingBee — GST invoice, AI payment reminders, Razorpay integration, aur proposal workflow. Free mein shuru karo.",
    "/vyapar-alternative"
  ),
  alternates: {
    canonical: "https://www.billingbee.co/vyapar-alternative",
  },
  other: {
    "application/ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Main freelancer hoon — Vyapar ya BillingBee?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "BillingBee. Vyapar retail shops ke liye design kiya gaya hai — inventory, barcode, physical products. Freelancers ke liye BillingBee zyada fit hai — service invoicing, proposals, AI reminders.",
          },
        },
        {
          "@type": "Question",
          name: "BillingBee mein inventory tracking hai?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Nahi — aur deliberately nahi hai. Freelancers aur consultants ko inventory ki zarurat nahi. BillingBee sirf woh features deta hai jo service-based businesses ko chahiye.",
          },
        },
        {
          "@type": "Question",
          name: "Vyapar offline kaam karta hai — BillingBee?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "BillingBee web-based hai — internet chahiye. Vyapar ka offline mode retail shops ke liye useful hai, freelancers ke liye usually zarurat nahi padti.",
          },
        },
        {
          "@type": "Question",
          name: "BillingBee mein GST invoice ban sakti hai?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Haan. CGST/SGST/IGST automatically calculate hota hai. GSTIN add karo, client ki state daalo — baaki automatic.",
          },
        },
        {
          "@type": "Question",
          name: "Proposal aur contract kaise kaam karte hain BillingBee mein?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Proposal banao → client email pe receive karta hai → approve karta hai → contract sign karta hai → aap invoice convert karte ho. Sab ek hi tool mein.",
          },
        },
        {
          "@type": "Question",
          name: "BillingBee ka free plan kaisa hai?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Free plan mein 5 invoices/month, 3 clients, GST invoice, AI reminders basic. Pro plan ₹849/month pe unlimited sab kuch.",
          },
        },
      ],
    }),
  },
}

const STEPS = [
  { n: "1", title: "Client add karo", desc: "Name, email, GSTIN — 30 seconds mein." },
  { n: "2", title: "Proposal bhejo (optional)", desc: "Client approve kare, contract sign kare, invoice automatically ban jaaye." },
  { n: "3", title: "Invoice bhejo", desc: "GST auto-calculate, Razorpay payment link included." },
  { n: "4", title: "AI chase karta hai", desc: "Client late kare toh Day 3, 7, 14 pe automatic reminder." },
]

const FEATURES = [
  { Icon: Bot, name: "AI Payment Reminders", desc: "Automatic follow-up — Vyapar mein nahi hai" },
  { Icon: FileText, name: "Proposal → Contract → Invoice", desc: "Poora client workflow — Vyapar mein nahi hai" },
  { Icon: TrendingUp, name: "AI Revenue Forecast", desc: "Future income predict karo — Vyapar mein nahi hai" },
  { Icon: Receipt, name: "GST Invoice", desc: "CGST/SGST/IGST auto-calculate" },
  { Icon: CreditCard, name: "Razorpay Integration", desc: "UPI, card, net banking" },
  { Icon: Globe, name: "Web-Based", desc: "Kisi bhi device se — koi installation nahi" },
]

const COMPARISON = [
  { feature: "AI Payment Reminders", bb: true, vyapar: false },
  { feature: "Proposal + Contract", bb: true, vyapar: false },
  { feature: "AI Revenue Forecast", bb: true, vyapar: false },
  { feature: "GST Invoice", bb: true, vyapar: true },
  { feature: "Web-Based (no install)", bb: true, vyapar: false },
  { feature: "Inventory Management", bb: false, vyapar: true },
  { feature: "Barcode Billing", bb: false, vyapar: true },
]

const FAQS = [
  {
    q: "Main freelancer hoon — Vyapar ya BillingBee?",
    a: "BillingBee. Vyapar retail shops ke liye design kiya gaya hai — inventory, barcode, physical products. Freelancers ke liye BillingBee zyada fit hai — service invoicing, proposals, AI reminders.",
  },
  {
    q: "BillingBee mein inventory tracking hai?",
    a: "Nahi — aur deliberately nahi hai. Freelancers aur consultants ko inventory ki zarurat nahi. BillingBee sirf woh features deta hai jo service-based businesses ko chahiye.",
  },
  {
    q: "Vyapar offline kaam karta hai — BillingBee?",
    a: "BillingBee web-based hai — internet chahiye. Vyapar ka offline mode retail shops ke liye useful hai, freelancers ke liye usually zarurat nahi padti.",
  },
  {
    q: "BillingBee mein GST invoice ban sakti hai?",
    a: "Haan. CGST/SGST/IGST automatically calculate hota hai. GSTIN add karo, client ki state daalo — baaki automatic.",
  },
  {
    q: "Proposal aur contract kaise kaam karte hain BillingBee mein?",
    a: "Proposal banao → client email pe receive karta hai → approve karta hai → contract sign karta hai → aap invoice convert karte ho. Sab ek hi tool mein.",
  },
  {
    q: "BillingBee ka free plan kaisa hai?",
    a: "Free plan mein 5 invoices/month, 3 clients, GST invoice, AI reminders basic. Pro plan ₹849/month pe unlimited sab kuch.",
  },
]

export default function VyaparAlternativePage() {
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
            <span className="inline-block bg-orange-50 text-orange-700 rounded-full px-3 py-1 text-sm font-medium">
              Vyapar se alag kuch chahiye?
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mt-4 leading-tight">
              Vyapar Shop Owners Ke Liye Hai
              <br />
              Freelancers Ke Liye BillingBee
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto mt-4 leading-relaxed">
              Vyapar inventory, barcode, aur retail billing ke liye banaya gaya hai.
              Agar aap freelancer, consultant, ya agency ho — BillingBee zyada fit hai.
              AI payment reminders, proposals, contracts — sab ek jagah.
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
                Comparison dekho
              </Link>
            </div>
            <div className="mt-6 flex gap-6 justify-center flex-wrap text-sm text-slate-400">
              <span>✓ No inventory setup</span>
              <span>✓ AI payment reminders</span>
              <span>✓ Proposal + Contract</span>
              <span>✓ Web-based</span>
            </div>
          </div>
        </section>

        {/* WHO SHOULD USE WHAT */}
        <section className="bg-slate-50 py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-slate-900 text-center">
              Kaun sa tool aapke liye sahi hai?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 max-w-4xl mx-auto">
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-6">
                <h3 className="font-semibold text-slate-900 text-lg mb-4">Vyapar use karo agar...</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>✓ Aap retail shop, kirana store, ya hardware shop chalate ho</li>
                  <li>✓ Aapko barcode billing aur inventory chahiye</li>
                  <li>✓ Aap offline bhi kaam karna chahte ho</li>
                  <li>✓ Aapke paas physical products hain</li>
                </ul>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
                <h3 className="font-semibold text-slate-900 text-lg mb-4">BillingBee use karo agar...</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>✓ Aap freelancer, consultant, ya agency ho</li>
                  <li>✓ Aapko service-based invoicing chahiye</li>
                  <li>✓ Client payment delay karta hai aur aapko reminder bhejni padti hai</li>
                  <li>✓ Proposals aur contracts bhi manage karne hain</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="bg-white py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-slate-900 text-center">
              Freelancers ke liye BillingBee kaise kaam karta hai?
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
              Freelancers ke liye banaya — not for shops
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
              BillingBee vs Vyapar — freelancer ke liye kaun sahi?
            </h2>
            <div className="mt-10 overflow-x-auto">
              <table className="w-full max-w-2xl mx-auto text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-slate-600 font-semibold">Feature</th>
                    <th className="py-3 px-4 bg-emerald-50 text-emerald-700 font-semibold rounded-t-lg">
                      BillingBee
                    </th>
                    <th className="py-3 px-4 text-slate-600 font-semibold">Vyapar</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map(({ feature, bb, vyapar }, i) => (
                    <tr key={feature} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="py-3 px-4 text-slate-700">{feature}</td>
                      <td className="py-3 px-4 text-center bg-emerald-50">
                        <span className={bb ? "text-emerald-500 font-semibold" : "text-slate-300"}>
                          {bb ? "✅" : "❌"}
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
              <p className="text-slate-400 text-xs text-center mt-4">
                * Inventory aur barcode features shop owners ke liye hain — freelancers ko zarurat nahi
              </p>
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
            <h2 className="text-3xl font-bold text-white">Freelancer ho toh BillingBee try karo</h2>
            <p className="text-emerald-100 mt-3">
              Shop owner nahi ho — toh Vyapar ki zarurat nahi. BillingBee exactly tumhare liye bana hai.
            </p>
            <Link
              href="/register"
              className="inline-block mt-8 bg-white text-emerald-700 px-8 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-all duration-150 active:scale-95"
            >
              Free Account Banao →
            </Link>
            <p className="mt-4 text-emerald-200 text-sm">
              No credit card · No inventory setup · GST ready
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
