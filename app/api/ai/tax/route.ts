import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { getOrgId } from "@/lib/session"

const client = new Anthropic()

const SYSTEM = `You are a GST (Goods and Services Tax) expert for India.
Answer questions about Indian GST rates, filing requirements, ITC (Input Tax Credit),
GSTR-1, GSTR-3B, composition scheme, RCM, and compliance.
Be concise and accurate. Format numbers and rates clearly.
If unsure, say so. Do not give legal advice — recommend consulting a CA for complex matters.`

export async function POST(req: NextRequest) {
  try {
    await getOrgId()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { message } = await req.json()
  if (!message?.trim()) return NextResponse.json({ error: "No message" }, { status: 400 })

  const msg = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 512,
    system: SYSTEM,
    messages: [{ role: "user", content: message.slice(0, 500) }],
  })

  const text = msg.content[0]?.type === "text" ? msg.content[0].text : ""
  return NextResponse.json({ message: text })
}
