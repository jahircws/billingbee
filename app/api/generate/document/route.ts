import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { checkRateLimit } from "@/lib/rate-limit"

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, "generate")
  if (limited) return limited

  const { documentType, fromName, toName, items, profession, template } = await req.json()

  if (!fromName || !toName) {
    return NextResponse.json({ error: "fromName and toName are required" }, { status: 400 })
  }

  const systemPrompt = `You are a professional document writer. Generate content for a ${documentType} from ${fromName} to ${toName}. Profession: ${profession || "freelancer"}. Return ONLY valid JSON, no markdown: { "items": [{"description": string, "qty": number, "rate": number}], "notes": string, "paymentTerms": string }`

  const userPrompt = items?.length
    ? `Enhance and fill in these existing items: ${JSON.stringify(items)}. Template style: ${template || "professional"}.`
    : `Generate 2-3 line items for a ${documentType}. Template style: ${template || "professional"}.`

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 600,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  })

  const text = message.content[0].type === "text" ? message.content[0].text : ""
  try {
    const parsed = JSON.parse(text)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 })
  }
}
