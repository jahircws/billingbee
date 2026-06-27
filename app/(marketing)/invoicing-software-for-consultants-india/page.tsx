import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { generatePageMetadata } from "@/lib/metadata"
import { FileText, PenLine, Receipt, Bot, CreditCard, TrendingUp } from "lucide-react"

export const metadata: Metadata = {
  ...generatePageMetadata(
    "Invoicing Software for Consultants India — GST, Proposals & AI Reminders | BillingBee",
    "India ke consultants ke liye free invoicing software. Proposal banao, contract sign karo, GST invoice bhejo, aur AI payment reminders se late payments khatam karo.",
    "/invoicing-software-for-consultants-india"
  ),
  alternates: {
    canonical: "https://www.billingbee.co/invoicing-software-for-consultants-india",
  },
  other: {
    "application/ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "BillingBee mein proposal kaise banate hain?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Dashboard mein Proposals section mein jaao → New Proposal → client ka naam, scope of work, amount daalo → Send karo. Client email pe link receive karta hai aur online approve kar sakta hai.",
          },
        },
        {
          "@type": "Question",
          name: "Digital contract sign valid hai legally?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Electronic signatures India mein Information Technology Act 2000 ke under valid hain. BillingBee ka contract signing flow basic e-signature provide karta hai.",
          },
        },
        {
          "@type": "Question",
          name: "GST invoice ke liye alag software chahiye?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Nahi. BillingBee mein proposal approve hone ke baad directly GST invoice convert ho jaata hai. CGST/SGST/IGST automatically calculate hota hai.",
          },
        },
        {
          "@type": "Question",
          name: "International clients ke liye bhi kaam karta hai?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Haan. Indian clients ke liye Razorpay + UPI, international clients ke liye Stripe. Multi-currency invoicing available hai Pro plan mein.",
          },
        },
        {
          "@type": "Question",
          name: "Agar client 30 din baad bhi pay nahi karta?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "BillingBee AI Day 3, Day 7, Day 14 pe polite reminder bhejta hai automatically. Aap dashboard se manually bhi reminder trigger kar sakte ho.",
          },
        },
        {
          "@type": "Question",
          name: "Mere existing clients aur invoices migrate ho sakte hain?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Clients aur invoices manually add kar sakte ho. CSV import feature roadmap pe hai. Zyada clients ke liye hamse contact karo — help karte hain.",
          },
        },
      ],
    }),
  },
}

const PAIN_CARDS = [
  {
    emoji: "📄",
    title: "Proposal alag, invoice alag",
    body: "Alag tools mein proposal banao, phir manually invoice banao. Client details baar baar enter karo.",
  },
  {
    emoji: "✍️",
    title: "Contract sign karana complicated hai",
    body: "Client ko PDF email karo, sign karke wapas bhejne bolo — yeh process weeks le leta hai.",
  },
  {
    emoji: "💸",
    title: "Client payment delay karta hai",
    body: "Invoice bhejne ke baad follow-up karna embarrassing lagta hai. Lekin karna padta hai.",
  },
]

const STEPS = [
  { n: "1", title: "Proposal banao", desc: "Client ka naam, scope, amount — professional proposal ready." },
  { n: "2", title: "Client approve kare", desc: "Email pe link bhejo — client online approve karta hai." },
  { n: "3", title: "Contract sign ho", desc: "Digital signature — client apne phone se sign kar sakta hai." },
  { n: "4", title: "Invoice convert karo", desc: "One click — proposal se GST invoice automatically ban jaati hai." },
  { n: "5", title: "AI payment chase karta hai", desc: "Day 3, 7, 14 pe automatic reminder — aap kuch nahi karte." },
]

const FEATURES = [
  { Icon: FileText, name: "Proposal Builder", desc: "Professional proposal — client directly approve kar sakta hai" },
  { Icon: PenLine, name: "Digital Contract", desc: "Client phone se sign kare — no printing needed" },
  { Icon: Receipt, name: "GST Invoice", desc: "Proposal se one-click convert, CGST/SGST auto" },
  { Icon: Bot, name: "AI Payment Reminders", desc: "Late payment? AI chase karta hai automatically" },
  { Icon: CreditCard, name: "Razorpay + Stripe", desc: "Indian aur international clients dono ke liye" },
  { Icon: TrendingUp, name: "AI Revenue Forecast", desc: "Agla quarter kaisa rahega — AI batata hai" },
]

const COMPARISON = [
  { feature: "Proposal Builder", bb: true, zoho: false, refrens: true, freshbooks: true },
  { feature: "Digital Contract", bb: true, zoho: false, refrens: false, freshbooks: true },
  { feature: "AI Payment Reminders", bb: true, zoho: false, refrens: false, freshbooks: false },
  { feature: "GST Invoice", bb: true, zoho: true, refrens: true, freshbooks: false },
  { feature: "Razorpay Integration", bb: true, zoho: true, refrens: false, freshbooks: false },
  { feature: "AI Revenue Forecast", bb: true, zoho: false, refrens: false, freshbooks: false },
]

const FAQS = [
  {
    q: "BillingBee mein proposal kaise banate hain?",
    a: "Dashboard mein Proposals section mein jaao → New Proposal → client ka naam, scope of work, amount daalo → Send karo. Client email pe link receive karta hai aur online approve kar sakta hai.",
  },
  {
    q: "Digital contract sign valid hai legally?",
    a: "Electronic signatures India mein Information Technology Act 2000 ke under valid hain. BillingBee ka contract signing flow basic e-signature provide karta hai.",
  },
  {
    q: "GST invoice ke liye alag software chahiye?",
    a: "Nahi. BillingBee mein proposal approve hone ke baad directly GST invoice convert ho jaata hai. CGST/SGST/IGST automatically calculate hota hai.",
  },
  {
    q: "International clients ke liye bhi kaam karta hai?",
    a: "Haan. Indian clients ke liye Razorpay + UPI, international clients ke liye Stripe. Multi-currency invoicing available hai Pro plan mein.",
  },
  {
    q: "Agar client 30 din baad bhi pay nahi karta?",
    a: "BillingBee AI Day 3, Day 7, Day 14 pe polite reminder bhejta hai automatically. Aap dashboard se manually bhi reminder trigger kar sakte ho.",
  },
  {
    q: "Mere existing clients aur invoices migrate ho sakte hain?",
    a: "Clients aur invoices manually add kar sakte ho. CSV import feature roadmap pe hai. Zyada clients ke liye hamse contact karo — help karte hain.",
  },
]

export default function ConsultantsIndiaPage() {
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
            <span className="inline-block bg-purple-50 text-purple-700 rounded-full px-3 py-1 text-sm font-medium">
              🤝 Consultants ke liye
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mt-4 leading-tight">
              Consulting Ka Poora Workflow
              <br />
              Ek Hi Tool Mein
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto mt-4 leading-relaxed">
              Proposal → Client approval → Contract signing → GST invoice → Payment.
              BillingBee mein sab connected hai. Aur agar client late pay kare —
              AI automatically follow-up karta hai.
            </p>
            <div className="mt-8 flex gap-4 justify-center flex-wrap">
              <Link
                href="/register"
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-150 active:scale-95"
              >
                Free mein shuru karo →
              </Link>
              <Link
                href="#how-it-works"
                className="text-slate-600 underline font-medium transition-all duration-150 hover:text-slate-900 flex items-center"
              >
                Workflow dekho
              </Link>
            </div>
            <div className="mt-6 flex gap-6 justify-center flex-wrap text-sm text-slate-400">
              <span>✓ Proposal + Contract</span>
              <span>✓ GST invoice</span>
              <span>✓ AI payment reminders</span>
              <span>✓ Razorpay ready</span>
            </div>
          </div>
        </section>

        {/* PAIN POINTS */}
        <section className="bg-slate-50 py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-slate-900 text-center">
              Consulting mein yeh problems hain na?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
              {PAIN_CARDS.map(({ emoji, title, body }) => (
                <div key={title} className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
                  <span className="text-3xl">{emoji}</span>
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
              Consulting workflow — start to payment
            </h2>
            <div className="flex flex-col md:flex-row gap-6 mt-10 items-start">
              {STEPS.map(({ n, title, desc }, i) => (
                <div key={n} className="flex-1 flex flex-col md:items-center md:text-center">
                  <div className="flex md:flex-col md:items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                      {n}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
                      <p className="text-slate-500 text-xs mt-1 leading-relaxed">{desc}</p>
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
              Consultants ke liye specifically
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
        <section className="bg-white py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-slate-900 text-center">
              Consultants ke liye kaun sa tool sahi hai?
            </h2>
            <div className="mt-10 overflow-x-auto">
              <table className="w-full max-w-3xl mx-auto text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-slate-600 font-semibold">Feature</th>
                    <th className="py-3 px-4 bg-emerald-50 text-emerald-700 font-semibold rounded-t-lg">
                      BillingBee
                    </th>
                    <th className="py-3 px-4 text-slate-600 font-semibold">Zoho Invoice</th>
                    <th className="py-3 px-4 text-slate-600 font-semibold">Refrens</th>
                    <th className="py-3 px-4 text-slate-600 font-semibold">Freshbooks</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map(({ feature, bb, zoho, refrens, freshbooks }, i) => (
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
                        <span className={freshbooks ? "text-emerald-500 font-semibold" : "text-slate-300"}>
                          {freshbooks ? "✅" : "❌"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-slate-400 text-xs text-center mt-4">
                * FreshBooks India mein GST support nahi karta
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-slate-50 py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-slate-900 text-center">
              Consultants ke sawaal
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
            <h2 className="text-3xl font-bold text-white">Consulting business ko streamline karo</h2>
            <p className="text-emerald-100 mt-3">
              Proposal se payment tak — sab ek tool mein. AI baaki sambhal lega.
            </p>
            <Link
              href="/register"
              className="inline-block mt-8 bg-white text-emerald-700 px-8 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-all duration-150 active:scale-95"
            >
              Free Account Banao →
            </Link>
            <p className="mt-4 text-emerald-200 text-sm">
              No credit card · GST ready · Cancel anytime
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
