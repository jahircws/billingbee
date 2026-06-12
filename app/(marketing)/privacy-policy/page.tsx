import type { Metadata } from "next"
import Link from "next/link"
import { generatePageMetadata } from "@/lib/metadata"
import { Zap } from "lucide-react"

export const revalidate = 86400

export const metadata: Metadata = generatePageMetadata(
  "Privacy Policy | BillingBee",
  "How BillingBee collects, uses, and protects your data.",
  "/privacy-policy",
  { keywords: ["BillingBee privacy", "data protection", "privacy policy"] }
)

const LAST_UPDATED = "12 June 2026"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold text-gray-900">BillingBee</span>
          </Link>
          <Link href="/generate" className="text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition-all active:scale-95">
            Try free →
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-black text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: {LAST_UPDATED}</p>

        <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-6 text-gray-600 text-sm leading-relaxed">
          <p className="text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            This is a placeholder policy provided for transparency during our beta. It will be
            replaced with a final, legally reviewed version before general availability.
          </p>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">1. Information we collect</h2>
            <p>
              We collect the information you provide when you create an account (name, email,
              business details), the invoice and client data you enter, and basic usage and
              device information to operate and improve the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">2. How we use your information</h2>
            <p>
              We use your data to provide BillingBee&apos;s features (generating invoices, sending
              reminders, processing payments), to communicate with you about your account, and to
              maintain the security and reliability of the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">3. Sharing &amp; third parties</h2>
            <p>
              We share data only with the processors needed to run BillingBee — for example email
              delivery and payment gateways — and only as required to deliver the service. We do
              not sell your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">4. Data retention &amp; security</h2>
            <p>
              We retain your data for as long as your account is active and apply industry-standard
              safeguards, including encryption of sensitive configuration. No method of transmission
              or storage is completely secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">5. Your rights</h2>
            <p>
              You may access, correct, export, or delete your data at any time from your account
              settings or by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">6. Contact</h2>
            <p>
              Questions about this policy? Email{" "}
              <a href="mailto:hello@billingbee.co" className="text-emerald-600 hover:underline">hello@billingbee.co</a>{" "}
              or use our <Link href="/contact" className="text-emerald-600 hover:underline">contact page</Link>.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-gray-100 bg-white py-6 text-center text-sm text-gray-400">
        <Link href="/" className="hover:text-gray-600">← Back to BillingBee</Link>
      </footer>
    </div>
  )
}
