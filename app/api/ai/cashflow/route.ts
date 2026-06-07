import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic()

interface PaymentRecord { month: string; received: number }
interface UnpaidInvoice { amount: number; dueDate: string; clientName: string }

export async function POST(req: NextRequest) {
  try {
    const { paymentHistory, unpaidInvoices, monthlyExpenses } = await req.json() as {
      paymentHistory: PaymentRecord[]
      unpaidInvoices: UnpaidInvoice[]
      monthlyExpenses: number
    }

    const totalUnpaid = unpaidInvoices.reduce((s, i) => s + i.amount, 0)
    const avgMonthly = paymentHistory.length
      ? paymentHistory.reduce((s, p) => s + p.received, 0) / paymentHistory.length
      : 0

    const prompt = `You are a financial analyst. Analyze this business cashflow data and provide a forecast.

Payment history (last 6 months):
${paymentHistory.map((p) => `${p.month}: ₹${p.received.toLocaleString()}`).join("\n")}

Outstanding invoices (total ₹${totalUnpaid.toLocaleString()}):
${unpaidInvoices.slice(0, 10).map((i) => `- ${i.clientName}: ₹${i.amount.toLocaleString()} due ${i.dueDate}`).join("\n")}

Monthly expenses: ₹${monthlyExpenses.toLocaleString()}
Average monthly revenue: ₹${avgMonthly.toLocaleString()}

Respond with ONLY valid JSON (no markdown):
{
  "expectedNextMonth": <number, realistic revenue forecast for next month in INR>,
  "latePaymentRisk": <"low"|"medium"|"high">,
  "narrative": "<2-3 sentence plain English analysis with specific numbers>"
}`

    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    })

    const text = (message.content[0] as { type: string; text: string }).text.trim()
    const json = JSON.parse(text)

    return NextResponse.json(json)
  } catch (err) {
    console.error("cashflow AI error", err)
    return NextResponse.json({ error: "Failed to generate forecast" }, { status: 500 })
  }
}
