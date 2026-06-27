import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import db from "@/lib/db"
import { signMobileToken } from "@/lib/mobile-jwt"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, country: bodyCountry } = body

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const country = typeof bodyCountry === "string" && bodyCountry ? bodyCountry : "US"
    const currency = country === "IN" ? "INR" : "USD"

    const user = await db.user.create({
      data: { email, name: name.trim(), passwordHash },
    })

    const slug = `org-${user.id.slice(-8)}`
    await db.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: name.trim(),
          slug,
          country,
          currency: currency as never,
        },
      })
      await tx.orgUser.create({ data: { orgId: org.id, userId: user.id, role: "OWNER" } })
    })

    const orgUser = await db.orgUser.findFirst({
      where: { userId: user.id, isActive: true },
      include: { org: true },
    })
    if (!orgUser) throw new Error("OrgUser creation failed")

    const token = await signMobileToken({ userId: user.id, orgId: orgUser.orgId })

    return NextResponse.json({
      token,
      userId: user.id,
      orgId: orgUser.orgId,
      name: orgUser.org.name,
      currency: orgUser.org.currency,
      country: orgUser.org.country,
      isNewUser: true,
    })
  } catch (err) {
    console.error("[mobile/auth/register]", err)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
