import { NextRequest, NextResponse } from "next/server"
import { getMobileSession } from "@/lib/mobile-auth"
import db from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await getMobileSession(req)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { orgId } = session

    const clients = await db.client.findMany({
      where: { orgId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, phone: true, currency: true },
    })

    return NextResponse.json({ clients })
  } catch (err) {
    console.error("[mobile/clients GET]", err)
    return NextResponse.json({ error: "Failed to load clients" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getMobileSession(req)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { orgId } = session
    const body = await req.json()
    const { name, email, phone, currency } = body

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const org = await db.organization.findUnique({
      where: { id: orgId },
      select: { currency: true },
    })

    const client = await db.client.create({
      data: {
        orgId,
        name: name.trim(),
        email: email || null,
        phone: phone || null,
        currency: (currency ?? org?.currency ?? "INR") as never,
      },
    })

    return NextResponse.json({ client })
  } catch (err) {
    console.error("[mobile/clients POST]", err)
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 })
  }
}
