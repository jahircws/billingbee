import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { randomUUID } from "crypto"
import { SESv2Client, PutSuppressedDestinationCommand } from "@aws-sdk/client-sesv2"

const sesClient = new SESv2Client({
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
})

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function recordUnsubscribe(email: string, reason?: string | null) {
  const normalized = email.trim().toLowerCase()
  await prisma.emailUnsubscribe.upsert({
    where: { email: normalized },
    create: { id: randomUUID(), email: normalized, reason: reason ?? null },
    update: { reason: reason ?? undefined },
  })
  try {
    await sesClient.send(new PutSuppressedDestinationCommand({
      EmailAddress: normalized,
      Reason: "COMPLAINT",
    }))
  } catch {
    // DB record is source of truth; SES failure is non-fatal
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = body?.email
    const reason = body?.reason ?? null
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }
    await recordUnsubscribe(email, reason)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// RFC 8058 one-click unsubscribe via GET
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 })
  }
  try {
    await recordUnsubscribe(email)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
