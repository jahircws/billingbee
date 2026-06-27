import { NextRequest, NextResponse } from "next/server"
import { getMobileSession } from "@/lib/mobile-auth"
import db from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await getMobileSession(req)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { userId, orgId } = session

    const [org, user] = await Promise.all([
      db.organization.findUnique({
        where: { id: orgId },
        select: {
          name: true,
          currency: true,
          country: true,
          plan: true,
          gstin: true,
          upiId: true,
          upiQrUrl: true,
        },
      }),
      db.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true, phone: true },
      }),
    ])

    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

    const isIndia = org.country === "IN"

    return NextResponse.json({
      name: org.name,
      email: user?.email ?? null,
      phone: user?.phone ?? null,
      currency: org.currency,
      country: org.country,
      plan: org.plan,
      gstin: isIndia ? org.gstin : null,
      upiId: isIndia ? org.upiId : null,
      upiQrUrl: isIndia ? org.upiQrUrl : null,
    })
  } catch (err) {
    console.error("[mobile/settings GET]", err)
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getMobileSession(req)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { orgId } = session
    const body = await req.json()
    const { name, gstin, upiId } = body

    const org = await db.organization.findUnique({
      where: { id: orgId },
      select: { country: true },
    })
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

    if ((gstin !== undefined || upiId !== undefined) && org.country !== "IN") {
      return NextResponse.json({ error: "GSTIN and UPI are only available for Indian accounts" }, { status: 403 })
    }

    const updated = await db.organization.update({
      where: { id: orgId },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(gstin !== undefined ? { gstin: gstin || null } : {}),
        ...(upiId !== undefined ? { upiId: upiId || null } : {}),
      },
      select: {
        name: true,
        currency: true,
        country: true,
        plan: true,
        gstin: true,
        upiId: true,
        upiQrUrl: true,
      },
    })

    const isIndia = updated.country === "IN"

    return NextResponse.json({
      name: updated.name,
      currency: updated.currency,
      country: updated.country,
      plan: updated.plan,
      gstin: isIndia ? updated.gstin : null,
      upiId: isIndia ? updated.upiId : null,
      upiQrUrl: isIndia ? updated.upiQrUrl : null,
    })
  } catch (err) {
    console.error("[mobile/settings PUT]", err)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
