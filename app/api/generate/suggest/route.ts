import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { checkRateLimit } from "@/lib/rate-limit"

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, "suggest")
  if (limited) return limited

  const { documentType, profession, existingItems } = await req.json()

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 200,
    system: `You are a billing assistant. Return ONLY valid JSON, no markdown: {"suggestions": [string, string, string]}`,
    messages: [
      {
        role: "user",
        content: `Suggest 3 short line item descriptions for a ${documentType} from a ${profession || "freelancer"}. Existing items: ${JSON.stringify(existingItems || [])}. Each suggestion should be 3-8 words, professional.`,
      },
    ],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : ""
  try {
    const parsed = JSON.parse(text)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ suggestions: ["Professional services", "Consulting fee", "Project work"] })
  }
}
