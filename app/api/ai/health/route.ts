import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { getOrgId } from "@/lib/session"
import { checkRateLimit } from "@/lib/rate-limit"
import type { HealthComponents } from "@/lib/health"

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const rateLimitResponse = await checkRateLimit(req, "ai")
  if (rateLimitResponse) return rateLimitResponse

  let orgId: string
  try {
    orgId = await getOrgId()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const score: HealthComponents = await req.json()

  const prompt = `You are a business financial advisor for a small business using BillingBee.

Business Health Score: ${score.total}/100
- Collection Efficiency: ${score.collectionEfficiency}/25 (${Math.round(score.details.paidOnTimeRate * 100)}% paid on time)
- Revenue Growth: ${score.revenueGrowth}/20 (${score.details.momGrowthPct > 0 ? "+" : ""}${score.details.momGrowthPct.toFixed(1)}% MoM)
- Client Concentration: ${score.clientConcentration}/20 (top client = ${score.details.topClientPct.toFixed(0)}% of revenue)
- Cashflow Risk: ${score.cashflowRisk}/20
- Payment Velocity: ${score.paymentVelocity}/15 (avg ${score.details.avgDaysToPay.toFixed(0)} days to pay)

Give exactly 3 specific, actionable recommendations to improve this score. Each recommendation should be 1-2 sentences and reference the specific metric. Return as a JSON array of strings: ["rec1", "rec2", "rec3"]`

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : ""

  let recommendations: string[] = []
  try {
    const match = text.match(/\[[\s\S]*\]/)
    if (match) recommendations = JSON.parse(match[0])
  } catch {
    recommendations = [text]
  }

  return NextResponse.json({ recommendations })
}
