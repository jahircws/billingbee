import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { randomUUID } from "crypto"

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function recordUnsubscribe(email: string) {
  const normalized = email.trim().toLowerCase()
  await prisma.emailUnsubscribe.upsert({
    where: { email: normalized },
    create: { id: randomUUID(), email: normalized },
    update: {},
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = body?.email
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }
    await recordUnsubscribe(email)
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
