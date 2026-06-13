import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { getOrgId } from "@/lib/session"
import { checkRateLimit } from "@/lib/rate-limit"
import { calculateHealthScore, type HealthComponents } from "@/lib/health"

const client = new Anthropic()

// Recommendations barely change hour to hour, so cache per org keyed by the
// rounded score. A short TTL stops a Haiku call on every dashboard navigation.
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour
const cache = new Map<string, { recommendations: string[]; expires: number }>()

function fmtMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `${currency} ${Math.round(amount)}`
  }
}

// A component only earns advice when it's genuinely weak; anything at/above this
// fraction of its max is "healthy" and is withheld from the model so it can't
// manufacture problems (e.g. a cash-reserve plan when cashflow is already full).
const WEAK_THRESHOLD = 0.7

// Friendly onboarding tips shown when there isn't enough history to trust the
// score. We never ask the model to diagnose thin data — that produces alarmist,
// artifact-driven advice (e.g. "100% client concentration") and leaks our own
// data-sufficiency thresholds back to the user.
function onboardingTips(): string[] {
  return [
    "Add your clients and send your first invoices — health insights sharpen as your billing history builds up.",
    "Set payment terms and due dates on every invoice so collection and payment-speed tracking can kick in.",
    "Turn on automatic payment reminders so follow-ups happen without you chasing them.",
  ]
}

// Each scored component, with the metric line shown to the model and a
// deterministic recommendation used as a fallback. `pts` is the fraction of max
// achieved (lower = weaker), and `metric` is the exact text we hand the model so
// we can later detect fabricated numbers that never appeared in the input.
function components(score: HealthComponents) {
  const cur = score.baseCurrency
  return [
    {
      key: "collection",
      pts: score.collectionEfficiency / 25,
      metric: `Collection Efficiency: ${score.collectionEfficiency}/25 (${Math.round(score.details.paidOnTimeRate * 100)}% of due invoices paid on time)`,
      rec: `Tighten collections: only ${Math.round(score.details.paidOnTimeRate * 100)}% of due invoices were paid on time. Send reminders before the due date and enable auto follow-ups.`,
    },
    {
      key: "growth",
      pts: score.revenueGrowth / 20,
      metric: `Revenue Growth: ${score.revenueGrowth}/20 (${score.details.momGrowthPct > 0 ? "+" : ""}${score.details.momGrowthPct.toFixed(1)}% MoM; this month ${fmtMoney(score.details.monthlyRevenue, cur)} vs last month ${fmtMoney(score.details.prevMonthRevenue, cur)})`,
      rec: `Revenue grew ${score.details.momGrowthPct.toFixed(0)}% month over month. Add 1-2 new engagements or upsell existing clients to push this higher.`,
    },
    {
      key: "concentration",
      pts: score.clientConcentration / 20,
      metric: `Client Concentration: ${score.clientConcentration}/20 (top client = ${score.details.topClientPct.toFixed(0)}% of revenue)`,
      rec: `Your top client is ${score.details.topClientPct.toFixed(0)}% of revenue. Diversify by landing 2-3 new clients to reduce dependency risk.`,
    },
    {
      key: "cashflow",
      pts: score.cashflowRisk / 20,
      metric: `Cashflow Risk: ${score.cashflowRisk}/20 (${fmtMoney(score.details.outstanding, cur)} outstanding)`,
      rec: `You have ${fmtMoney(score.details.outstanding, cur)} outstanding. Prioritize collecting overdue invoices to protect cashflow.`,
    },
    {
      key: "velocity",
      pts: score.paymentVelocity / 15,
      metric: `Payment Velocity: ${score.paymentVelocity}/15 (avg ${score.details.avgDaysToPay.toFixed(0)} days to pay)`,
      rec: `Invoices take about ${Math.round(score.details.avgDaysToPay)} days to get paid. Offer online payment and shorter terms to speed this up.`,
    },
  ]
}

// The weakest components worth acting on: those below the healthy threshold,
// lowest first, capped at 3. May be empty when everything is healthy.
function weakComponents(score: HealthComponents) {
  return components(score)
    .filter((c) => c.pts < WEAK_THRESHOLD)
    .sort((a, b) => a.pts - b.pts)
    .slice(0, 3)
}

// Deterministic fallback when the model is unavailable, returns unparseable
// output, or fails validation. Targets the weakest components so advice stays
// relevant; if nothing is weak, the caller handles the all-healthy case.
function fallbackRecommendations(score: HealthComponents): string[] {
  const weak = weakComponents(score)
  return (weak.length > 0 ? weak : components(score).sort((a, b) => a.pts - b.pts).slice(0, 3)).map(
    (c) => c.rec,
  )
}

// Reject model output that fabricates numbers or pushes meta-advice. We only
// trust recommendations grounded in the metrics we actually handed the model.
function isGroundedRecommendation(rec: string, allowedText: string): boolean {
  // Meta-advice: telling the user to create more invoices/data to "unlock" or
  // "validate" metrics — that's our internal data-sufficiency heuristic leaking.
  if (/\b(unlock|validate|establish reliable|more accurate)\b/i.test(rec) && /invoice|data|metric|history/i.test(rec)) {
    return false
  }
  // Fabricated figures: any multi-digit (grouped) number in the rec must also
  // appear in the metric text we provided. Bare small numbers (e.g. "2-3 new
  // clients", "30 days") are fine — we only guard grouped/large amounts.
  const numbers = rec.match(/\d[\d,]*\d/g) ?? []
  const allowedNumbers = new Set(allowedText.match(/\d[\d,]*\d/g) ?? [])
  for (const n of numbers) {
    const digits = n.replace(/,/g, "")
    // Only police "money-sized" numbers (1,000+); small counts/days are allowed.
    if (Number(digits) >= 1000 && !allowedNumbers.has(n) && !allowedNumbers.has(digits)) {
      return false
    }
  }
  return true
}

export async function POST(req: NextRequest) {
  const rateLimitResponse = await checkRateLimit(req, "ai")
  if (rateLimitResponse) return rateLimitResponse

  let orgId: string
  try {
    orgId = await getOrgId()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Compute the score server-side from the org — never trust a client-supplied score.
  const score = await calculateHealthScore(orgId)

  const cacheKey = `${orgId}:${score.total}`
  const hit = cache.get(cacheKey)
  if (hit && hit.expires > Date.now()) {
    return NextResponse.json({ recommendations: hit.recommendations, score })
  }

  // 1. Thin history → onboarding tips, no model call. Diagnosing artifact metrics
  //    (e.g. "100% client concentration" off a single invoice) produces alarmist,
  //    misleading advice no matter how the prompt is hedged.
  if (score.limitedData) {
    const recommendations = onboardingTips()
    cache.set(cacheKey, { recommendations, expires: Date.now() + CACHE_TTL_MS })
    return NextResponse.json({ recommendations, score })
  }

  // 2. Only the genuinely weak components reach the model. An all-healthy org gets
  //    a positive deterministic message instead of invented problems.
  const weak = weakComponents(score)
  if (weak.length === 0) {
    const recommendations = [
      `Your business health score is ${score.total}/100 — all key metrics are in good shape. Keep invoicing consistently and maintaining timely collections to hold this.`,
    ]
    cache.set(cacheKey, { recommendations, expires: Date.now() + CACHE_TTL_MS })
    return NextResponse.json({ recommendations, score })
  }

  const cur = score.baseCurrency
  const metricLines = weak.map((c) => `- ${c.metric}`).join("\n")
  const count = weak.length
  const prompt = `You are a business financial advisor for a small business using BillingBee. All amounts are in ${cur}.

The business has a Health Score of ${score.total}/100. The following areas scored below target and are the ONLY areas you may advise on:
${metricLines}

Give exactly ${count} specific, actionable recommendation${count > 1 ? "s" : ""} — one per area above, in the same order. Each is 1-2 sentences referencing that area's metric.

Rules:
- Advise ONLY on the areas listed above. Do not mention any other metric or invent a new problem.
- Never tell the user to create more invoices, generate more data, or "unlock"/"validate" metrics.
- Never state a specific monetary amount unless it appears verbatim in the metrics above. Small counts (e.g. "2-3 clients") and day counts are fine.

Return ONLY a JSON array of ${count} string${count > 1 ? "s" : ""}: [${weak.map((_, i) => `"rec${i + 1}"`).join(", ")}]`

  let recommendations: string[] = []
  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 600,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    })
    const text = message.content[0].type === "text" ? message.content[0].text : ""
    const match = text.match(/\[[\s\S]*\]/)
    if (match) {
      const parsed = JSON.parse(match[0])
      if (
        Array.isArray(parsed) &&
        parsed.every((r) => typeof r === "string") &&
        parsed.every((r) => isGroundedRecommendation(r, metricLines))
      ) {
        recommendations = parsed
      }
    }
  } catch {
    // fall through to deterministic recommendations
  }

  if (recommendations.length === 0) {
    recommendations = fallbackRecommendations(score)
  }

  cache.set(cacheKey, { recommendations, expires: Date.now() + CACHE_TTL_MS })
  return NextResponse.json({ recommendations, score })
}
