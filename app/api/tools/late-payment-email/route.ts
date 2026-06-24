import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { checkRateLimit } from "@/lib/rate-limit"

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, "latePaymentEmail")
  if (limited) return limited

  const body = await req.json()
  const { clientName, invoiceNumber, amount, daysOverdue, tone, yourName } = body

  if (!clientName || !invoiceNumber || !amount || daysOverdue == null || !tone || !yourName) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 })
  }

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system:
        "You are a professional business communication expert. Write a payment reminder email. Respond ONLY with a JSON object, no markdown. Format: { subject: string, body: string }. The body should use \\n for line breaks. Keep it professional, clear, and effective.",
      messages: [
        {
          role: "user",
          content: `Write a ${tone} payment reminder email. Client name: ${clientName}. Invoice: ${invoiceNumber}. Amount: ${amount}. Days overdue: ${daysOverdue}. Sender name: ${yourName}. Tone guide — Friendly: warm and understanding; Firm: professional and direct; Final Notice: serious, mention potential action.`,
        },
      ],
    })

    const text = message.content[0].type === "text" ? message.content[0].text : ""
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const result = JSON.parse(clean)

    return NextResponse.json(result)
  } catch (error) {
    console.error("late-payment-email tool error:", error)
    return NextResponse.json({ error: "Failed to generate email. Please try again." }, { status: 500 })
  }
}
