import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { generatePageMetadata } from "@/lib/metadata"
import { Calculator, FileDown, Bot, Smartphone, Users, TrendingUp } from "lucide-react"

export const metadata: Metadata = {
  ...generatePageMetadata(
    "GST Invoice Software India — Free GST Billing for Freelancers & Small Business | BillingBee",
    "Free GST invoice software India ke freelancers aur small businesses ke liye. CGST, SGST, IGST auto-calculate. Professional PDF, UPI payment, AI reminders. Abhi free mein try karo.",
    "/gst-invoice-software-india"
  ),
  alternates: {
    canonical: "https://www.billingbee.co/gst-invoice-software-india",
  },
  other: {
    "application/ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "BillingBee mein GST invoice bilkul free hai?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Haan. Free plan mein 5 GST invoices/month bilkul free hain. Pro plan mein unlimited GST invoices milti hain ₹849/month pe.",
          },
        },
        {
          "@type": "Question",
          name: "CGST aur SGST automatically split hota hai?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Haan. Aap aur client same state mein hain toh BillingBee automatically 50-50 split karta hai. Alag state ke liye IGST apply hota hai. Koi manual calculation nahi.",
          },
        },
        {
          "@type": "Question",
          name: "Client ka GSTIN nahi hai toh?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Koi baat nahi. BillingBee B2C invoices bhi banata hai — client GSTIN optional hai. GST amount correctly calculate hota hai dono cases mein.",
          },
        },
        {
          "@type": "Question",
          name: "PDF legal GST format mein hoti hai?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Haan. BillingBee ki GST invoice PDF government-mandated format follow karti hai — GSTIN, HSN/SAC code, tax breakdown sab included.",
          },
        },
        {
          "@type": "Question",
          name: "GSTR filing ke liye data export ho sakta hai?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Haan. Pro plan mein GSTR-ready CSV export available hai. Apne CA ko directly bhej sakte ho.",
          },
        },
        {
          "@type": "Question",
          name: "Agar GST rate change ho toh?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Settings mein tax rate update karo — sab future invoices pe automatically apply hoga. Past invoices unchanged rahenge.",
          },
        },
      ],
    }),
  },
}

const GST_CARDS = [
  {
    badge: "Same State",
    badgeClass: "bg-blue-50 text-blue-700",
    title: "CGST + SGST",
    body: "Jab aap aur client ek hi state mein hote hain. BillingBee automatically dono split karta hai.",
    example: "e.g. Delhi → Delhi: 9% CGST + 9% SGST = 18%",
  },
  {
    badge: "Different State",
    badgeClass: "bg-purple-50 text-purple-700",
    title: "IGST",
    body: "Jab client doosre state mein ho. Integrated GST automatically apply hota hai.",
    example: "e.g. Delhi → Mumbai: 18% IGST",
  },
  {
    badge: "Export / SEZ",
    badgeClass: "bg-green-50 text-green-700",
    title: "Zero Rated",
    body: "International clients ya SEZ ko invoice karte time zero-rated GST automatically set hota hai.",
    example: "e.g. India → USA: 0% GST (LUT)",
  },
]

const STEPS = [
  { n: "1", title: "GSTIN add karo", desc: "Settings mein apna GSTIN enter karo. Ek baar — hamesha ke liye." },
  { n: "2", title: "Client add karo", desc: "Client ka naam, state, aur GSTIN (agar ho) daalo." },
  { n: "3", title: "Invoice banao", desc: "Amount daalo — CGST/SGST/IGST automatically calculate hoga." },
  { n: "4", title: "PDF download ya email", desc: "Professional GST invoice PDF ready. Client ko bhejo ya download karo." },
]

const FEATURES = [
  { Icon: Calculator, name: "GST Auto-Calculate", desc: "CGST/SGST/IGST — state ke hisaab se automatic" },
  { Icon: FileDown, name: "Professional PDF", desc: "Legal GST format, apna logo, branded invoice" },
  { Icon: Bot, name: "AI Payment Reminders", desc: "Client late kare toh AI automatically follow-up karta hai" },
  { Icon: Smartphone, name: "UPI + Razorpay", desc: "Invoice pe seedha payment link — zero extra steps" },
  { Icon: Users, name: "Multi-Client", desc: "Unlimited clients, har ek ka GST track hota hai" },
  { Icon: TrendingUp, name: "GST Reports", desc: "GSTR-ready export, CA ko bhejne ke liye ready" },
]

const COMPARISON = [
  { feature: "GST Auto-Calculate", bb: true, zoho: true, refrens: true, vyapar: true },
  { feature: "AI Payment Reminders", bb: true, zoho: false, refrens: false, vyapar: false },
  { feature: "Proposal + Contract", bb: true, zoho: false, refrens: true, vyapar: false },
  { feature: "AI Revenue Forecast", bb: true, zoho: false, refrens: false, vyapar: false },
  { feature: "UPI + Razorpay", bb: true, zoho: true, refrens: false, vyapar: true },
]

const FAQS = [
  {
    q: "BillingBee mein GST invoice bilkul free hai?",
    a: "Haan. Free plan mein 5 GST invoices/month bilkul free hain. Pro plan mein unlimited GST invoices milti hain ₹849/month pe.",
  },
  {
    q: "CGST aur SGST automatically split hota hai?",
    a: "Haan. Aap aur client same state mein hain toh BillingBee automatically 50-50 split karta hai. Alag state ke liye IGST apply hota hai. Koi manual calculation nahi.",
  },
  {
    q: "Client ka GSTIN nahi hai toh?",
    a: "Koi baat nahi. BillingBee B2C invoices bhi banata hai — client GSTIN optional hai. GST amount correctly calculate hota hai dono cases mein.",
  },
  {
    q: "PDF legal GST format mein hoti hai?",
    a: "Haan. BillingBee ki GST invoice PDF government-mandated format follow karti hai — GSTIN, HSN/SAC code, tax breakdown sab included.",
  },
  {
    q: "GSTR filing ke liye data export ho sakta hai?",
    a: "Haan. Pro plan mein GSTR-ready CSV export available hai. Apne CA ko directly bhej sakte ho.",
  },
  {
    q: "Agar GST rate change ho toh?",
    a: "Settings mein tax rate update karo — sab future invoices pe automatically apply hoga. Past invoices unchanged rahenge.",
  },
]

export default function GstInvoiceSoftwareIndiaPage() {
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
              🧾 GST Compliant Software
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mt-4 leading-tight">
              GST Invoice Banao
              <br />
              2 Minute Mein — Bilkul Free
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto mt-4 leading-relaxed">
              CGST, SGST, IGST automatically calculate hota hai. Professional GST invoice
              PDF banao, client ko bhejo, aur UPI ya Razorpay se payment lo. Koi
              accounting knowledge nahi chahiye.
            </p>
            <div className="mt-8 flex gap-4 justify-center flex-wrap">
              <Link
                href="/register"
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-150 active:scale-95"
              >
                Free GST Invoice Banao →
              </Link>
              <Link
                href="/free-invoice-generator"
                className="text-slate-600 underline font-medium transition-all duration-150 hover:text-slate-900 flex items-center"
              >
                Sample invoice dekho
              </Link>
            </div>
            <div className="mt-6 flex gap-6 justify-center flex-wrap text-sm text-slate-400">
              <span>✓ CGST/SGST/IGST auto-calculate</span>
              <span>✓ Professional PDF</span>
              <span>✓ Free plan available</span>
              <span>✓ No CA needed</span>
            </div>
          </div>
        </section>

        {/* GST TYPES EXPLAINED */}
        <section className="bg-slate-50 py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-slate-900 text-center">
              Kaun sa GST apply hoga — BillingBee decide karta hai
            </h2>
            <p className="text-slate-500 text-center mt-2">
              Aapko sirf client ki location dalni hai — baaki automatic
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
              {GST_CARDS.map(({ badge, badgeClass, title, body, example }) => (
                <div
                  key={title}
                  className="bg-white rounded-xl shadow-sm p-6 border border-slate-100"
                >
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                    {badge}
                  </span>
                  <h3 className="font-semibold text-slate-900 mt-3 text-lg">{title}</h3>
                  <p className="text-slate-500 mt-2 text-sm leading-relaxed">{body}</p>
                  <p className="text-slate-400 text-xs mt-2">{example}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="bg-white py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-slate-900 text-center">
              GST invoice kaise banate hain?
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
              Sirf GST nahi — poora invoicing system
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
              GST invoice software compare karo
            </h2>
            <p className="text-slate-500 text-center mt-2">
              India ke top tools — features aur AI ke saath
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
                    <th className="py-3 px-4 text-slate-600 font-semibold">Refrens</th>
                    <th className="py-3 px-4 text-slate-600 font-semibold">Vyapar</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map(({ feature, bb, zoho, refrens, vyapar }, i) => (
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
                        <span className={refrens ? "text-emerald-500 font-semibold" : "text-slate-300"}>
                          {refrens ? "✅" : "❌"}
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
              GST invoice ke baare mein sawaal
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
            <h2 className="text-3xl font-bold text-white">Pehli GST invoice aaj banao</h2>
            <p className="text-emerald-100 mt-3">2 minute setup. Professional PDF. Bilkul free.</p>
            <Link
              href="/register"
              className="inline-block mt-8 bg-white text-emerald-700 px-8 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-all duration-150 active:scale-95"
            >
              Free Account Banao →
            </Link>
            <p className="mt-4 text-emerald-200 text-sm">
              No credit card · GST compliant · Cancel anytime
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
