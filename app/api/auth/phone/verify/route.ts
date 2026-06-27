import { NextRequest, NextResponse } from "next/server"
import { SignJWT } from "jose"
import { getAdminAuth } from "@/lib/firebase-admin"
import prisma from "@/lib/db"
import { getGeoDefaults } from "@/lib/geo"

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json()
    if (typeof idToken !== "string" || !idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 })
    }

    // Verify Firebase ID token
    const adminAuth = getAdminAuth()
    const decoded = await adminAuth.verifyIdToken(idToken)
    const phone = decoded.phone_number
    if (!phone) {
      return NextResponse.json({ error: "No phone number in token" }, { status: 400 })
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { phone } })
    let isNew = false

    if (!user) {
      isNew = true
      user = await prisma.user.create({
        data: { phone, email: `phone_${phone.replace(/\+/g, "")}@billingbee.internal` },
      })
    }

    // Ensure user has an org
    let orgUser = await prisma.orgUser.findFirst({
      where: { userId: user.id, isActive: true },
      include: { org: true },
    })

    if (!orgUser) {
      const geo = await getGeoDefaults()
      const baseSlug = `org-${user.id.slice(-8)}`
      const org = await prisma.$transaction(async (tx) => {
        const created = await tx.organization.create({
          data: {
            name: "My Business",
            slug: baseSlug,
            currency: geo.currency as never,
            country: geo.country,
          },
        })
        await tx.orgUser.create({ data: { orgId: created.id, userId: user!.id, role: "OWNER" } })
        return created
      })
      orgUser = await prisma.orgUser.findFirst({
        where: { userId: user.id, isActive: true },
        include: { org: true },
      })
      if (!orgUser) throw new Error("OrgUser creation failed")
      isNew = true
      void org
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

    // Mint a short-lived session token for the phone credentials provider
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET ?? "")
    const sessionToken = await new SignJWT({
      userId: user.id,
      orgId: orgUser.orgId,
      orgName: orgUser.org.name,
      orgSlug: orgUser.org.slug,
      role: orgUser.role,
      userType: "STAFF",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("5m")
      .sign(secret)

    return NextResponse.json({
      sessionToken,
      redirectUrl: isNew ? "/onboarding" : "/dashboard",
    })
  } catch (err) {
    console.error("[phone/verify]", err)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
