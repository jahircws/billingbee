import { NextRequest, NextResponse } from "next/server"
import { compare } from "bcryptjs"
import prisma from "@/lib/db"
import { createAdminToken } from "@/lib/admin-auth"

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 })
  }

  const admin = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } })
  if (!admin || !admin.isActive) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  const valid = await compare(password, admin.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  })

  await prisma.adminLog.create({
    data: {
      adminId: admin.id,
      action: "LOGIN",
      ipAddress: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? undefined,
    },
  })

  const token = await createAdminToken({
    adminId: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  })

  const res = NextResponse.json({ ok: true })
  res.cookies.set("admin_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours
    path: "/",
  })
  return res
}
