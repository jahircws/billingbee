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

// Deterministic fallback when the model is unavailable or returns unparseable
// output. Targets the two weakest components so advice stays relevant.
function fallbackRecommendations(score: HealthComponents): string[] {
  const ranked = [
    { key: "collection", pts: score.collectionEfficiency / 25, rec: `Tighten collections: only ${Math.round(score.details.paidOnTimeRate * 100)}% of due invoices were paid on time. Send reminders before the due date and enable auto follow-ups.` },
    { key: "growth", pts: score.revenueGrowth / 20, rec: `Revenue grew ${score.details.momGrowthPct.toFixed(0)}% month over month. Add 1-2 new engagements or upsell existing clients to push this higher.` },
    { key: "concentration", pts: score.clientConcentration / 20, rec: `Your top client is ${score.details.topClientPct.toFixed(0)}% of revenue. Diversify by landing 2-3 new clients to reduce dependency risk.` },
    { key: "cashflow", pts: score.cashflowRisk / 20, rec: `You have ${fmtMoney(score.details.outstanding, score.baseCurrency)} outstanding. Prioritize collecting overdue invoices to protect cashflow.` },
    { key: "velocity", pts: score.paymentVelocity / 15, rec: `Invoices take about ${Math.round(score.details.avgDaysToPay)} days to get paid. Offer online payment and shorter terms to speed this up.` },
  ]
  ranked.sort((a, b) => a.pts - b.pts)
  return ranked.slice(0, 3).map((r) => r.rec)
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

  const cur = score.baseCurrency
  const prompt = `You are a business financial advisor for a small business using BillingBee. All amounts are in ${cur}.

Business Health Score: ${score.total}/100${score.limitedData ? ` (LIMITED DATA: ${score.limitedDataReason} — keep advice cautious and avoid over-reading the metrics)` : ""}
- Collection Efficiency: ${score.collectionEfficiency}/25 (${Math.round(score.details.paidOnTimeRate * 100)}% of due invoices paid on time)
- Revenue Growth: ${score.revenueGrowth}/20 (${score.details.momGrowthPct > 0 ? "+" : ""}${score.details.momGrowthPct.toFixed(1)}% MoM; this month ${fmtMoney(score.details.monthlyRevenue, cur)} vs last month ${fmtMoney(score.details.prevMonthRevenue, cur)})
- Client Concentration: ${score.clientConcentration}/20 (top client = ${score.details.topClientPct.toFixed(0)}% of revenue)
- Cashflow Risk: ${score.cashflowRisk}/20 (${fmtMoney(score.details.outstanding, cur)} outstanding)
- Payment Velocity: ${score.paymentVelocity}/15 (avg ${score.details.avgDaysToPay.toFixed(0)} days to pay)

Give exactly 3 specific, actionable recommendations to improve this score. Each recommendation should be 1-2 sentences and reference the specific metric. Return ONLY a JSON array of 3 strings: ["rec1", "rec2", "rec3"]`

  let recommendations: string[] = []
  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    })
    const text = message.content[0].type === "text" ? message.content[0].text : ""
    const match = text.match(/\[[\s\S]*\]/)
    if (match) {
      const parsed = JSON.parse(match[0])
      if (Array.isArray(parsed) && parsed.every((r) => typeof r === "string")) {
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
