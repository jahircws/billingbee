import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { generatePageMetadata } from "@/lib/metadata"
import { Zap } from "lucide-react"

export const revalidate = 86400

export const metadata: Metadata = generatePageMetadata(
  "Terms of Service | BillingBee",
  "The terms that govern your use of BillingBee.",
  "/terms-service",
  { keywords: ["BillingBee terms", "terms of service", "user agreement"] }
)

const LAST_UPDATED = "12 June 2026"

export default function TermsServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="BillingBee" width={140} height={28} className="brightness-0" />
          </Link>
          <Link href="/generate" className="text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition-all active:scale-95">
            Try free →
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-black text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: {LAST_UPDATED}</p>

        <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-6 text-gray-600 text-sm leading-relaxed">
          

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">1. Acceptance of terms</h2>
            <p>
              By creating an account or using BillingBee, you agree to these terms. If you do not
              agree, please do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">2. Using the service</h2>
            <p>
              You are responsible for the accuracy of the invoices, client details, and tax
              information you create, and for keeping your account credentials secure. You agree not
              to misuse the service or use it for unlawful purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">3. Plans &amp; billing</h2>
            <p>
              Paid plans are billed in advance on a recurring basis. You can manage or cancel your
              subscription from your account settings. Fees already paid are non-refundable except
              where required by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">4. Your content</h2>
            <p>
              You retain ownership of the data you submit. You grant us the limited rights needed to
              host and process it in order to provide the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">5. Disclaimers &amp; liability</h2>
            <p>
              BillingBee is provided &quot;as is&quot; without warranties of any kind. We are not a
              substitute for professional tax or legal advice. To the extent permitted by law, our
              liability is limited to the amount you paid in the preceding twelve months.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">6. Changes &amp; contact</h2>
            <p>
              We may update these terms from time to time. Continued use after changes constitutes
              acceptance. Questions? Email{" "}
              <a href="mailto:hello@billingbee.co" className="text-emerald-600 hover:underline">hello@billingbee.co</a>{" "}
              or visit our <Link href="/contact" className="text-emerald-600 hover:underline">contact page</Link>.
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
