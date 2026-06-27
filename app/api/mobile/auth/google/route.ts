import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/firebase-admin"
import db from "@/lib/db"
import { signMobileToken } from "@/lib/mobile-jwt"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { idToken, country: bodyCountry } = body

    if (typeof idToken !== "string" || !idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 })
    }

    const decoded = await getAdminAuth().verifyIdToken(idToken)
    const email = decoded.email
    const name = decoded.name ?? decoded.display_name ?? null

    if (!email) {
      return NextResponse.json({ error: "No email in token" }, { status: 400 })
    }

    let user = await db.user.findUnique({ where: { email } })
    let isNewUser = false

    if (!user) {
      isNewUser = true
      user = await db.user.create({ data: { email, name: name ?? null } })
    }

    let orgUser = await db.orgUser.findFirst({
      where: { userId: user.id, isActive: true },
      include: { org: true },
    })

    if (!orgUser) {
      isNewUser = true
      const country = (typeof bodyCountry === "string" && bodyCountry) ? bodyCountry : "US"
      const currency = country === "IN" ? "INR" : "USD"
      const slug = `org-${user.id.slice(-8)}`

      await db.$transaction(async (tx) => {
        const org = await tx.organization.create({
          data: {
            name: name ?? "My Business",
            slug,
            country,
            currency: currency as never,
          },
        })
        await tx.orgUser.create({ data: { orgId: org.id, userId: user!.id, role: "OWNER" } })
      })

      orgUser = await db.orgUser.findFirst({
        where: { userId: user.id, isActive: true },
        include: { org: true },
      })
      if (!orgUser) throw new Error("OrgUser creation failed")
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
      isNewUser,
    })
  } catch (err) {
    console.error("[mobile/auth/google]", err)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
