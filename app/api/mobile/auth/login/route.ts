import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import db from "@/lib/db"
import { signMobileToken } from "@/lib/mobile-jwt"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const orgUser = await db.orgUser.findFirst({
      where: { userId: user.id, isActive: true },
      include: { org: true },
    })
    if (!orgUser) {
      return NextResponse.json({ error: "No organization found for this account" }, { status: 401 })
    }

    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

    const token = await signMobileToken({ userId: user.id, orgId: orgUser.orgId })

    return NextResponse.json({
      token,
      userId: user.id,
      orgId: orgUser.orgId,
      name: orgUser.org.name,
      currency: orgUser.org.currency,
      country: orgUser.org.country,
    })
  } catch (err) {
    console.error("[mobile/auth/login]", err)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
