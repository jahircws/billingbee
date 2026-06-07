import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { getOrgId } from "@/lib/session"
import { checkRateLimit } from "@/lib/rate-limit"
import { EXTRACTION_PROMPT } from "@/lib/extraction-prompt"

const client = new Anthropic()
const MAX_BYTES = 10 * 1024 * 1024 // 10MB

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"])

export async function POST(req: NextRequest) {
  let orgId: string
  try {
    orgId = await getOrgId()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const limited = await checkRateLimit(req, "extractOrg", `org:${orgId}`)
  if (limited) return limited

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 })

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 413 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const mimeType = file.type

  return runExtraction(buffer, mimeType)
}

export async function runExtraction(buffer: Buffer, mimeType: string): Promise<NextResponse> {
  const base64 = buffer.toString("base64")

  let messages: Anthropic.MessageParam[]

  if (IMAGE_TYPES.has(mimeType)) {
    const mediaType = mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp"
    messages = [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          { type: "text", text: EXTRACTION_PROMPT },
        ],
      },
    ]
  } else if (mimeType === "application/pdf") {
    messages = [
      {
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
          { type: "text", text: EXTRACTION_PROMPT },
        ],
      },
    ]
  } else {
    // text/plain, .eml, and anything else — read as UTF-8
    const text = buffer.toString("utf-8")
    messages = [
      {
        role: "user",
        content: `${text}\n\n${EXTRACTION_PROMPT}`,
      },
    ]
  }

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 800,
      messages,
    })

    const raw = message.content[0].type === "text" ? message.content[0].text : ""
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON found")

    const extraction = JSON.parse(jsonMatch[0])
    return NextResponse.json({ extraction, confidence: extraction.confidence ?? "low" })
  } catch {
    return NextResponse.json({ error: "Could not read document" }, { status: 422 })
  }
}
