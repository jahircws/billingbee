"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { completeOnboarding } from "@/app/actions/onboarding"

const GOAL_CTA: Record<string, { label: string; href: string }> = {
  invoices:    { label: "Set up your first client →", href: "/clients/new?onboarding=true" },
  proposals:   { label: "Set up your first client →", href: "/clients/new?onboarding=true" },
  payments:    { label: "Set up your first client →", href: "/clients/new?onboarding=true" },
  collections: { label: "Set up your first client →", href: "/clients/new?onboarding=true" },
}

const STEPS = [
  "Add a client",
  "Create an invoice (AI writes it for you)",
  "Send a payment link",
  "Get paid",
]

interface Props {
  firstName: string
  goal: string
}

export default function WelcomeClient({ firstName, goal }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const cta = GOAL_CTA[goal] ?? GOAL_CTA.invoices

  async function handleCTA() {
    setLoading(true)
    await completeOnboarding()
    router.push(cta.href)
  }

  return (
    <div className="min-h-screen bg-white flex items-start justify-center pt-20 px-4">
      <div className="w-full max-w-lg">
        {/* Founder card */}
        <div className="flex flex-col items-center text-center mb-8">
          <img
            src="/amit.jpeg"
            alt="Amit"
            className="w-20 h-20 rounded-full object-cover object-top border-2 border-emerald-500 mb-4"
          />
          <p className="text-xl font-bold text-slate-800">Hi {firstName}, I&apos;m Amit</p>
          <p className="text-sm text-slate-500">Founder, BillingBee</p>
        </div>

        <hr className="border-slate-100 mb-6" />

        <p className="text-slate-700 font-medium text-center mb-6">
          You&apos;re 60 seconds away from sending your first invoice.
        </p>

        {/* Steps */}
        <ul className="space-y-3 mb-8">
          {STEPS.map((step) => (
            <li key={step} className="flex items-center gap-3 text-sm text-slate-700">
              <span className="text-emerald-500 font-bold">✓</span>
              {step}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          onClick={handleCTA}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors mb-4"
        >
          {loading ? "Setting up…" : cta.label}
        </button>

        <p className="text-xs text-slate-400 text-center">
          Questions? Email me at amit@billingbee.co
        </p>
      </div>
    </div>
  )
}
