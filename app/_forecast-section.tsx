"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

const SCENARIOS = [
  {
    text: `You've collected ₹1,24,000 from 4 clients this month — your strongest quarter yet. Watch: GlobalTech Inc has been silent for 47 days and owes ₹80,000. Tip: Reach out this week before it becomes overdue.`,
    stats: [
      { label: "Outstanding", value: "₹80,000" },
      { label: "Overdue", value: "1" },
      { label: "Avg/month", value: "₹41,333" },
      { label: "Dormant", value: "1" },
    ],
  },
  {
    text: `Your USD revenue is growing — $12,400 collected from 2 clients. Opportunity: Mako Systems hasn't been invoiced in 60 days. They paid in 4 days last time.`,
    stats: [
      { label: "Outstanding", value: "$0" },
      { label: "Overdue", value: "0" },
      { label: "Avg/month", value: "$4,133" },
      { label: "Dormant", value: "1" },
    ],
  },
]

const TYPING_SPEED = 28
const PAUSE_AFTER_TYPE = 2000
const FADE_DURATION = 400

type Phase = "typing" | "stats" | "pause" | "fadeout"

export function ForecastSection() {
  const [scenarioIdx, setScenarioIdx] = useState(0)
  const [displayedText, setDisplayedText] = useState("")
  const [phase, setPhase] = useState<Phase>("typing")
  const [visibleStats, setVisibleStats] = useState<boolean[]>([false, false, false, false])
  const [fading, setFading] = useState(false)

  const phaseRef = useRef<Phase>("typing")
  const scenarioIdxRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function clear() {
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  function setPhaseRef(p: Phase) {
    phaseRef.current = p
    setPhase(p)
  }

  useEffect(() => {
    const scenario = SCENARIOS[scenarioIdx]
    const fullText = scenario.text
    let charIdx = 0

    setDisplayedText("")
    setVisibleStats([false, false, false, false])
    setFading(false)
    setPhaseRef("typing")

    function typeNext() {
      charIdx++
      setDisplayedText(fullText.slice(0, charIdx))
      if (charIdx < fullText.length) {
        timerRef.current = setTimeout(typeNext, TYPING_SPEED)
      } else {
        // typing done — show stats staggered
        setPhaseRef("stats")
        scenario.stats.forEach((_, i) => {
          timerRef.current = setTimeout(() => {
            setVisibleStats((prev) => {
              const next = [...prev]
              next[i] = true
              return next
            })
          }, 150 * (i + 1))
        })
        // pause then fade out
        timerRef.current = setTimeout(() => {
          setPhaseRef("pause")
          timerRef.current = setTimeout(() => {
            setPhaseRef("fadeout")
            setFading(true)
            timerRef.current = setTimeout(() => {
              const next = (scenarioIdxRef.current + 1) % SCENARIOS.length
              scenarioIdxRef.current = next
              setScenarioIdx(next)
            }, FADE_DURATION)
          }, PAUSE_AFTER_TYPE)
        }, 150 * scenario.stats.length + 200)
      }
    }

    timerRef.current = setTimeout(typeNext, TYPING_SPEED)
    return clear
  }, [scenarioIdx])

  const scenario = SCENARIOS[scenarioIdx]

  return (
    <section className="bg-[#1e2330] py-24 px-4 relative overflow-hidden">
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* Subtle top glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 80% 50%, rgba(139,92,246,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">

          {/* ── Left: text ── */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5">
              <span>✦</span> AI Revenue Forecast
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-[1.15] mb-4">
              Know what&apos;s coming before it arrives
            </h2>

            <p className="text-slate-300 text-base leading-relaxed mb-8">
              BillingBee analyses your payment history and predicts your next 90
              days of revenue — which clients will pay, which are at risk, and
              where your next opportunity is hiding.
            </p>

            <ul className="space-y-3 mb-10">
              {[
                "90-day revenue prediction",
                "Late payer alerts before they're overdue",
                "Dormant client opportunities surfaced automatically",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-200">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                      <path d="M2 5l2 2 4-4" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              className="inline-flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white px-7 py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95"
            >
              Start for free →
            </Link>
          </div>

          {/* ── Right: animated forecast card ── */}
          <div className="flex justify-center md:justify-end">
            <div
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 transition-opacity"
              style={{
                opacity: fading ? 0 : 1,
                transition: `opacity ${FADE_DURATION}ms ease`,
              }}
            >
              {/* Card header */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-slate-900 text-base">Revenue Forecast</h3>
                <span className="inline-flex items-center gap-1.5 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  <span>✦</span> AI
                </span>
              </div>

              {/* Typing text */}
              <div className="bg-slate-50 rounded-xl p-4 mb-5 min-h-[110px]">
                <p className="text-sm text-slate-700 leading-relaxed">
                  {displayedText}
                  {phase === "typing" && (
                    <span className="inline-block w-0.5 h-4 bg-purple-500 ml-0.5 align-middle animate-pulse" />
                  )}
                </p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                {scenario.stats.map((s, i) => (
                  <div
                    key={s.label}
                    className="bg-slate-50 rounded-xl p-3 transition-all duration-300"
                    style={{
                      opacity: visibleStats[i] ? 1 : 0,
                      transform: visibleStats[i] ? "translateY(0)" : "translateY(6px)",
                    }}
                  >
                    <p className="text-xs text-slate-400 mb-0.5">{s.label}</p>
                    <p className="text-base font-semibold text-slate-900">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <p className="text-center text-xs text-slate-400 mt-4">
                Updated automatically · Based on your history
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
