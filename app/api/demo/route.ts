import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { sanitizeInput } from "@/lib/sanitize"
import Anthropic from "@anthropic-ai/sdk"

// aiRateLimit does not exist in lib/rate-limit — using checkRateLimit with a
// "demo:" prefix key so demo traffic is isolated from authenticated generate quota.
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1"
  const limited = await checkRateLimit(req, "generate", `demo:${ip}`)
  if (limited) {
    return NextResponse.json(
      { error: "Demo limit reached — sign up to create unlimited proposals" },
      { status: 429 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const rawPrompt = (body as Record<string, unknown>).prompt

  if (!rawPrompt || typeof rawPrompt !== "string" || !rawPrompt.trim()) {
    return NextResponse.json({ error: "Project description is required" }, { status: 400 })
  }

  if (rawPrompt.length > 500) {
    return NextResponse.json(
      { error: "Please keep your description under 500 characters" },
      { status: 400 },
    )
  }

  const prompt = sanitizeInput(rawPrompt)

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 400,
      system:
        "You are BillingBee AI. Generate a concise, professional project proposal based on the user's description. Structure it with: a 2-sentence executive summary, scope of work (3 bullet points max), timeline, and investment amount. Keep it under 200 words. Use professional but warm language. Output the proposal content directly — no preamble, no meta-commentary, no markdown headers.",
      messages: [{ role: "user", content: prompt }],
    })

    const text = message.content[0].type === "text" ? message.content[0].text : ""
    return NextResponse.json({ proposal: text })
  } catch (err) {
    console.error("[demo/route] Anthropic error:", err)
    return NextResponse.json(
      { error: "Something went wrong — try signing up for full access" },
      { status: 500 },
    )
  }
}
