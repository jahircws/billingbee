import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { generatePageMetadata } from "@/lib/metadata"
import { Bot, Receipt, Smartphone, CreditCard, FileText, TrendingUp } from "lucide-react"

export const metadata: Metadata = {
  ...generatePageMetadata(
    "Free Invoicing Software for Freelancers in India — GST, UPI & AI Reminders | BillingBee",
    "India ka pehla AI-powered invoicing tool freelancers ke liye. GST invoice banao, UPI se payment lo, aur AI automatic payment reminders bhejta hai. Free mein shuru karo.",
    "/invoicing-software-for-freelancers-india"
  ),
  alternates: {
    canonical: "https://www.billingbee.co/invoicing-software-for-freelancers-india",
  },
  other: {
    "application/ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Kya BillingBee India mein free hai?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Haan. Free plan mein 5 invoices/month, 3 clients, GST invoice, aur UPI QR support included hai. Koi credit card nahi chahiye.",
          },
        },
        {
          "@type": "Question",
          name: "GST invoice kaise banate hain BillingBee mein?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Client add karo, invoice create karo, apna GSTIN daalo — CGST/SGST/IGST automatic calculate hota hai. PDF download ya email se bhej sakte ho.",
          },
        },
        {
          "@type": "Question",
          name: "AI payment reminders kaise kaam karte hain?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Jab aap invoice send karte ho, BillingBee track karta hai ki client ne dekha ya nahi. Agar payment nahi aayi, Day 3, Day 7, Day 14 pe automatically polite reminder email jaata hai.",
          },
        },
        {
          "@type": "Question",
          name: "Kya Razorpay connect ho sakta hai BillingBee se?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Haan. Settings mein Razorpay keys add karo — phir client invoice mein directly card, net banking, ya UPI se pay kar sakta hai.",
          },
        },
        {
          "@type": "Question",
          name: "Zoho Invoice free hai, toh BillingBee kyun use karein?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Zoho mein AI payment reminders nahi hain. Agar aap manually clients ko chase karte ho toh woh time aur discomfort BillingBee remove karta hai. AI collections sirf BillingBee mein hai.",
          },
        },
        {
          "@type": "Question",
          name: "Proposal aur contract bhi ban sakta hai?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Haan. BillingBee mein proposal banao, client approve kare, contract sign kare, phir invoice convert karo — sab ek hi jagah.",
          },
        },
      ],
    }),
  },
}

const FEATURES = [
  { Icon: Bot, name: "AI Payment Reminders", desc: "Automatic follow-up — aapko chase nahi karna" },
  { Icon: Receipt, name: "GST Invoice", desc: "CGST/SGST/IGST auto-calculate, legal format" },
  { Icon: Smartphone, name: "UPI Ready", desc: "QR code invoice pe — GPay, PhonePe, Paytm" },
  { Icon: CreditCard, name: "Razorpay Integration", desc: "Card, Net Banking, UPI — sab ek jagah" },
  { Icon: FileText, name: "Proposal → Contract → Invoice", desc: "Poora workflow ek hi tool mein" },
  { Icon: TrendingUp, name: "AI Revenue Forecast", desc: "Agla mahina kaisa rahega, AI batata hai" },
]

const STEPS = [
  { n: "1", title: "Client add karo", desc: "Name, email, GST number — 30 seconds mein done." },
  { n: "2", title: "Invoice banao", desc: "GST auto-calculate, professional template, apna logo add karo." },
  { n: "3", title: "Send karo", desc: "Email ya WhatsApp link se client ko invoice bhejo." },
  { n: "4", title: "Paid ho jao", desc: "UPI, Razorpay, ya card — client jo prefer kare. AI reminder automatic." },
]

const PAIN_CARDS = [
  {
    emoji: "😤",
    title: "Client ne invoice dekha hi nahi",
    body: "BillingBee dikhata hai exactly kab client ne invoice open kiya — aur automatically remind karta hai.",
  },
  {
    emoji: "😰",
    title: "Payment ke liye baar baar message karna padta hai",
    body: "AI Day 3, Day 7, Day 14 pe automatic follow-up bhejta hai. Aap bas kaam karo.",
  },
  {
    emoji: "💸",
    title: "GST calculate karna confusing hai",
    body: "CGST, SGST, IGST — sab auto-calculate hota hai. Sirf amount daalo, baaki BillingBee karta hai.",
  },
]

const COMPARISON = [
  { feature: "AI Payment Reminders", bb: true, zoho: false, refrens: false },
  { feature: "AI Revenue Forecast", bb: true, zoho: false, refrens: false },
  { feature: "Proposal → Contract → Invoice", bb: true, zoho: false, refrens: true },
  { feature: "GST Invoice", bb: true, zoho: true, refrens: true },
  { feature: "Razorpay Integration", bb: true, zoho: true, refrens: false },
]

const FAQS = [
  {
    q: "Kya BillingBee India mein free hai?",
    a: "Haan. Free plan mein 5 invoices/month, 3 clients, GST invoice, aur UPI QR support included hai. Koi credit card nahi chahiye.",
  },
  {
    q: "GST invoice kaise banate hain BillingBee mein?",
    a: "Client add karo, invoice create karo, apna GSTIN daalo — CGST/SGST/IGST automatic calculate hota hai. PDF download ya email se bhej sakte ho.",
  },
  {
    q: "AI payment reminders kaise kaam karte hain?",
    a: "Jab aap invoice send karte ho, BillingBee track karta hai ki client ne dekha ya nahi. Agar payment nahi aayi, Day 3, Day 7, Day 14 pe automatically polite reminder email jaata hai.",
  },
  {
    q: "Kya Razorpay connect ho sakta hai BillingBee se?",
    a: "Haan. Settings mein Razorpay keys add karo — phir client invoice mein directly card, net banking, ya UPI se pay kar sakta hai.",
  },
  {
    q: "Zoho Invoice free hai, toh BillingBee kyun use karein?",
    a: "Zoho mein AI payment reminders nahi hain. Agar aap manually clients ko chase karte ho toh woh time aur discomfort BillingBee remove karta hai. AI collections sirf BillingBee mein hai.",
  },
  {
    q: "Proposal aur contract bhi ban sakta hai?",
    a: "Haan. BillingBee mein proposal banao, client approve kare, contract sign kare, phir invoice convert karo — sab ek hi jagah.",
  },
]

export default function FreelancerIndiaPage() {
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
            <span className="inline-block bg-emerald-50 text-emerald-700 rounded-full px-3 py-1 text-sm font-medium">
              🇮🇳 Made for Indian Freelancers
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mt-4 leading-tight">
              Client Payment Delay?
              <br />
              BillingBee AI Automatically Chase Karta Hai
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto mt-4 leading-relaxed">
              GST invoice banao, UPI ya Razorpay se payment lo — aur agar client late kare
              toh BillingBee khud reminder bhejta hai. Aapko awkward message nahi karna.
            </p>
            <div className="mt-8 flex gap-4 justify-center flex-wrap">
              <Link
                href="/register"
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-150 active:scale-95"
              >
                Free mein shuru karo →
              </Link>
              <Link
                href="/free-invoice-generator"
                className="text-slate-600 underline font-medium transition-all duration-150 hover:text-slate-900 flex items-center"
              >
                Demo dekho
              </Link>
            </div>
            <div className="mt-6 flex gap-6 justify-center flex-wrap text-sm text-slate-400">
              <span>✓ Free plan available</span>
              <span>✓ No credit card required</span>
              <span>✓ GST compliant</span>
              <span>✓ UPI + Razorpay ready</span>
            </div>
          </div>
        </section>

        {/* PAIN POINTS */}
        <section className="bg-slate-50 py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-slate-900 text-center">
              Freelancing mein yeh problems hain na?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
              {PAIN_CARDS.map(({ emoji, title, body }) => (
                <div
                  key={title}
                  className="bg-white rounded-xl shadow-sm p-6 border border-slate-100"
                >
                  <span className="text-3xl">{emoji}</span>
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
              Kaise kaam karta hai?
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
              Sirf freelancers ke liye banaya
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
              BillingBee vs baaki tools
            </h2>
            <p className="text-slate-500 text-center mt-2">
              Sirf AI features compare karo — baaki sab same hai
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
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map(({ feature, bb, zoho, refrens }, i) => (
                    <tr
                      key={feature}
                      className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}
                    >
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
            <h2 className="text-3xl font-bold text-white">Pehla invoice aaj banao</h2>
            <p className="text-emerald-100 mt-3">
              5 minute mein setup. Client ko bhejo. AI baaki sambhal lega.
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
