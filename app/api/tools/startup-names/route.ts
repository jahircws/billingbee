import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { checkRateLimit } from "@/lib/rate-limit"

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, "startupNames")
  if (limited) return limited

  const body = await req.json()
  const { description, industry, style, length } = body

  if (!description || description.length < 10 || description.length > 200) {
    return NextResponse.json({ error: "Description must be between 10 and 200 characters." }, { status: 400 })
  }

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system:
        "You are a creative startup naming expert. Generate exactly 10 unique, memorable business name suggestions. Respond ONLY with a JSON array, no markdown, no explanation. Each item: { name: string, tagline: string }. Names should be creative, easy to spell, and feel like real brand names.",
      messages: [
        {
          role: "user",
          content: `Business does: ${description}. Industry: ${industry}. Style: ${style}. Length preference: ${length}. Generate 10 startup name suggestions.`,
        },
      ],
    })

    const text = message.content[0].type === "text" ? message.content[0].text : ""
    const names = JSON.parse(text)

    return NextResponse.json({ names })
  } catch {
    return NextResponse.json({ error: "Failed to generate names. Please try again." }, { status: 500 })
  }
}
