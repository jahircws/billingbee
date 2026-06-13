import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin-auth"
import prisma from "@/lib/db"
import { addDays } from "date-fns"
import { encode } from "next-auth/jwt"

export async function POST(req: NextRequest) {
  const adminSession = await getAdminSession()
  if (!adminSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { orgId, action, plan } = await req.json()
  if (!orgId || !action) return NextResponse.json({ error: "Missing params" }, { status: 400 })

  const org = await prisma.organization.findUnique({ where: { id: orgId } })
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (action === "extend_trial") {
    const base = org.planExpiry && org.planExpiry > new Date() ? org.planExpiry : new Date()
    await prisma.organization.update({
      where: { id: orgId },
      data: { plan: "pro", planExpiry: addDays(base, 30) },
    })
    await prisma.adminLog.create({
      data: {
        adminId: adminSession.adminId,
        action: "EXTEND_TRIAL",
        target: "Organization",
        targetId: orgId,
        metadata: { days: 30 },
      },
    })
    return NextResponse.json({ ok: true })
  }

  if (action === "set_plan") {
    if (!plan) return NextResponse.json({ error: "Missing plan" }, { status: 400 })
    await prisma.organization.update({ where: { id: orgId }, data: { plan } })
    await prisma.adminLog.create({
      data: {
        adminId: adminSession.adminId,
        action: "SET_PLAN",
        target: "Organization",
        targetId: orgId,
        metadata: { plan },
      },
    })
    return NextResponse.json({ ok: true })
  }

  if (action === "impersonate") {
    const ownerLink = await prisma.orgUser.findFirst({
      where: { orgId, role: "OWNER" },
      include: { user: true },
    })
    if (!ownerLink) return NextResponse.json({ error: "No owner found" }, { status: 400 })

    // Find the org slug for the redirect
    const orgFull = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { slug: true },
    })

    await prisma.adminLog.create({
      data: {
        adminId: adminSession.adminId,
        action: "IMPERSONATE",
        target: "Organization",
        targetId: orgId,
        metadata: { userId: ownerLink.userId, email: ownerLink.user.email },
        ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      },
    })

    const secure = process.env.NODE_ENV === "production"
    const cookieName = secure ? "__Secure-authjs.session-token" : "authjs.session-token"

    // Encode a real NextAuth v5 session token so the app treats this as a
    // normal authenticated session for the org owner.
    const sessionToken = await encode({
      token: {
        sub: ownerLink.userId,
        email: ownerLink.user.email,
        name: ownerLink.user.name,
        userId: ownerLink.userId,
        orgId,
        orgName: org.name,
        orgSlug: orgFull?.slug,
        role: "OWNER",
        userType: "STAFF",
        impersonatedBy: adminSession.adminId,
      },
      secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "nextauth-secret-placeholder",
      salt: cookieName,
      maxAge: 3600,
    })

    const res = NextResponse.json({ ok: true, redirectTo: `/dashboard` })
    res.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      maxAge: 3600,
      path: "/",
    })
    return res
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
