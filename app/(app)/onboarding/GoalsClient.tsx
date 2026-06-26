"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { saveOnboardingGoal } from "@/app/actions/onboarding"

const GOALS = [
  { id: "invoices", emoji: "📄", label: "Send invoices & get paid" },
  { id: "proposals", emoji: "📋", label: "Create proposals & contracts" },
  { id: "payments", emoji: "📊", label: "Track payments & cash flow" },
  { id: "collections", emoji: "🤖", label: "Automate payment follow-ups" },
]

export default function GoalsClient() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Animation state
  const [logoVisible, setLogoVisible] = useState(false)
  const [headingVisible, setHeadingVisible] = useState(false)
  const [subtextVisible, setSubtextVisible] = useState(false)
  const [cardsVisible, setCardsVisible] = useState([false, false, false, false])
  const [btnVisible, setBtnVisible] = useState(false)

  useEffect(() => {
    const t0 = setTimeout(() => setLogoVisible(true), 0)
    const t1 = setTimeout(() => setHeadingVisible(true), 150)
    const t2 = setTimeout(() => setSubtextVisible(true), 250)
    const t3 = setTimeout(() => setCardsVisible([true, false, false, false]), 350)
    const t4 = setTimeout(() => setCardsVisible([true, true, false, false]), 450)
    const t5 = setTimeout(() => setCardsVisible([true, true, true, false]), 550)
    const t6 = setTimeout(() => setCardsVisible([true, true, true, true]), 650)
    const t7 = setTimeout(() => setBtnVisible(true), 750)
    return () => [t0, t1, t2, t3, t4, t5, t6, t7].forEach(clearTimeout)
  }, [])

  async function handleContinue() {
    if (!selected) return
    setLoading(true)
    await saveOnboardingGoal(selected)
    router.push("/onboarding/welcome")
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Logo */}
      <div
        className="p-6 transition-all duration-300"
        style={{ opacity: logoVisible ? 1 : 0 }}
      >
        <span className="text-slate-900 font-bold text-lg tracking-tight">BILLINGBEE.CO</span>
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-16">
        <div className="w-full max-w-lg">
          <h1
            className="text-2xl font-bold text-slate-800 text-center mb-2 transition-all duration-400"
            style={{ opacity: headingVisible ? 1 : 0, transform: headingVisible ? "translateY(0)" : "translateY(20px)" }}
          >
            What brings you to BillingBee?
          </h1>
          <p
            className="text-slate-500 text-sm text-center mb-8 transition-all duration-300"
            style={{ opacity: subtextVisible ? 1 : 0 }}
          >
            We&apos;ll set things up based on your answer.
          </p>

          {/* 2x2 goal cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {GOALS.map((goal, i) => {
              const isSelected = selected === goal.id
              return (
                <button
                  key={goal.id}
                  onClick={() => setSelected(goal.id)}
                  className={[
                    "border rounded-xl p-6 text-left cursor-pointer transition-all duration-200",
                    isSelected
                      ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500"
                      : "border-slate-200 hover:border-emerald-400 hover:bg-emerald-50",
                  ].join(" ")}
                  style={{
                    opacity: cardsVisible[i] ? 1 : 0,
                    transform: cardsVisible[i] ? "translateY(0)" : "translateY(16px)",
                    transition: "opacity 0.4s ease, transform 0.4s ease, border-color 0.2s, background-color 0.2s, box-shadow 0.2s",
                  }}
                >
                  <div className="text-2xl mb-3">{goal.emoji}</div>
                  <div className="text-sm font-medium text-slate-800">{goal.label}</div>
                </button>
              )
            })}
          </div>

          {/* Continue button */}
          <div
            className="transition-all duration-300"
            style={{ opacity: btnVisible ? 1 : 0 }}
          >
            <button
              onClick={handleContinue}
              disabled={!selected || loading}
              className="w-full py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Saving…" : "Continue →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
