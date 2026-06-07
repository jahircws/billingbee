import { NextRequest } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { runExtraction } from "@/app/api/ai/extract/route"

const MAX_BYTES = 10 * 1024 * 1024

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, "extract")
  if (limited) return limited

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) {
    const { NextResponse } = await import("next/server")
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    const { NextResponse } = await import("next/server")
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 413 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  return runExtraction(buffer, file.type)
}
