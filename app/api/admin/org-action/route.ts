import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin-auth"
import prisma from "@/lib/db"
import { addDays } from "date-fns"
import { SignJWT } from "jose"

const APP_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET ?? "nextauth-secret-placeholder"
)

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
    // Find the org owner
    const ownerLink = await prisma.orgUser.findFirst({
      where: { orgId, role: "OWNER" },
      include: { user: true },
    })
    if (!ownerLink) return NextResponse.json({ error: "No owner found" }, { status: 400 })

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

    // Issue a short-lived impersonation JWT (1 hour)
    const token = await new SignJWT({
      sub: ownerLink.userId,
      email: ownerLink.user.email,
      orgId,
      orgName: org.name,
      role: "OWNER",
      userType: "STAFF",
      impersonatedBy: adminSession.adminId,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(APP_SECRET)

    const res = NextResponse.json({ ok: true, redirectTo: "/dashboard" })
    res.cookies.set("impersonate_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600,
      path: "/",
    })
    return res
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
