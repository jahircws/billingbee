import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { getOrgId } from "@/lib/session"
import { getActivePlan } from "@/lib/plan"
import { getRevenueForecastData } from "@/app/actions/forecast"
import db from "@/lib/db"

const anthropic = new Anthropic()

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£", CAD: "CA$", AUD: "A$",
  SGD: "S$", AED: "AED", PKR: "Rs", BDT: "৳", LKR: "Rs", NPR: "Rs",
  MVR: "Rf", MYR: "RM", THB: "฿", PHP: "₱", IDR: "Rp", VND: "₫",
  KRW: "₩", JPY: "¥", CNY: "¥", HKD: "HK$", TWD: "NT$", ZAR: "R",
  NGN: "₦", KES: "KSh", GHS: "₵", EGP: "£",
}

const RATE_LIMIT_HOURS = 1

export async function POST() {
  let orgId: string
  try {
    orgId = await getOrgId()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Rate limit: 1 request per org per hour
  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { lastForecastAt: true },
  })

  if (org?.lastForecastAt) {
    const hoursSince =
      (Date.now() - org.lastForecastAt.getTime()) / (1000 * 60 * 60)
    if (hoursSince < RATE_LIMIT_HOURS) {
      return NextResponse.json(
        { error: "Rate limit: one forecast per hour", retryAfterMinutes: Math.ceil((RATE_LIMIT_HOURS - hoursSince) * 60) },
        { status: 429 }
      )
    }
  }

  const [facts, plan] = await Promise.all([
    getRevenueForecastData(orgId),
    getActivePlan(orgId),
  ])

  const isPro = plan === "pro"
  const currencySymbol = CURRENCY_SYMBOLS[facts.currency] ?? facts.currency

  if (!facts.hasSufficientData) {
    return NextResponse.json({
      forecast:
        "Add at least 5 paid invoices to unlock your revenue forecast. Once you have payment history, BillingBee will predict your next 90 days of revenue.",
      hasSufficientData: false,
      isPro,
      stats: {
        totalOutstanding: facts.totalOutstanding,
        overdueCount: facts.overdueCount,
        avgMonthlyRevenue: facts.avgMonthlyRevenue,
        dormantClientCount: facts.dormantClients.length,
      },
    })
  }

  // Strip client-level detail for free plan before sending to AI
  const dataForAI = isPro
    ? facts
    : {
        ...facts,
        clientStats: undefined,
        slowPayers: facts.slowPayers.slice(0, 2),
        dormantClients: facts.dormantClients.slice(0, 1),
      }

  const systemPrompt = `You are BillingBee's revenue intelligence assistant. You analyse a freelancer or small business owner's payment history and write a plain-English revenue forecast.
Rules:
* Write 2-3 sentences maximum
* Never invent numbers — only use figures from the DATA block
* Use the currency symbol "${currencySymbol}" for all amounts
* Be specific and actionable
* If there are overdue invoices, mention the risk
* If there are dormant high-value clients, mention the opportunity
* Do not use jargon like "liquidity" or "accounts receivable"
* End with one specific action sentence starting with "Watch:" or "Tip:" or "Opportunity:"
* For free plan users: only reference 30-day figures, never 90-day
* For pro plan users: give full 90-day picture with client-level insight
* Do not use markdown formatting. No **bold**, no *italics*, no bullet points. Plain text only.`

  const userMessage = `Here is the payment data for this business. Write their revenue forecast.\n\nDATA:\n${JSON.stringify(dataForAI, null, 2)}\n\nPlan: ${isPro ? "pro" : "free"}`

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    })

    const forecast = (message.content[0] as { type: string; text: string }).text.trim()

    // Update rate limit timestamp
    await db.organization.update({
      where: { id: orgId },
      data: { lastForecastAt: new Date() },
    })

    return NextResponse.json({
      forecast,
      hasSufficientData: true,
      isPro,
      stats: {
        totalOutstanding: facts.totalOutstanding,
        overdueCount: facts.overdueCount,
        avgMonthlyRevenue: facts.avgMonthlyRevenue,
        dormantClientCount: facts.dormantClients.length,
      },
    })
  } catch (err) {
    console.error("forecast AI error", err)
    return NextResponse.json({ error: "Failed to generate forecast" }, { status: 500 })
  }
}
