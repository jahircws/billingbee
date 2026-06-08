import type { Metadata } from "next"
import Link from "next/link"
import { generatePageMetadata } from "@/lib/metadata"
import { Zap, Mail, MessageSquare, Clock } from "lucide-react"

export const revalidate = 86400

export const metadata: Metadata = generatePageMetadata(
  "Contact Us | BillingBee",
  "Get in touch with the BillingBee team. We typically respond within 24 hours on business days.",
  "/contact",
  { keywords: ["BillingBee contact", "billing support India", "invoice app help"] }
)

export default function ContactPage() {
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
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-900 mb-4">Get in Touch</h1>
          <p className="text-gray-500 text-lg">We typically respond within 24 hours on business days.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Mail size={18} className="text-emerald-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
            <a href="mailto:hello@billingbee.co" className="text-sm text-emerald-600 hover:underline">
              hello@billingbee.co
            </a>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <MessageSquare size={18} className="text-emerald-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">In-app chat</h3>
            <p className="text-sm text-gray-500">Use the AI copilot inside BillingBee</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Clock size={18} className="text-emerald-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Response time</h3>
            <p className="text-sm text-gray-500">Within 24 hours, Mon–Fri</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Send us a message</h2>
          <form
            action="mailto:hello@billingbee.co"
            method="GET"
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Your name"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Subject</label>
              <input
                type="text"
                name="subject"
                placeholder="How can we help?"
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Message</label>
              <textarea
                name="body"
                rows={5}
                placeholder="Describe your question or issue..."
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-all active:scale-95 text-sm"
            >
              Send message
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            For billing issues, log in and go to{" "}
            <Link href="/settings" className="text-emerald-600 hover:underline">Settings → Plan</Link>
          </p>
        </div>
      </main>

      <footer className="border-t border-gray-100 bg-white py-6 text-center text-sm text-gray-400">
        <Link href="/" className="hover:text-gray-600">← Back to BillingBee</Link>
      </footer>
    </div>
  )
}
