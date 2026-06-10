import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { hash } from "bcryptjs"
import prisma from "@/lib/db"

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()
  if (!token || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })

  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET ?? "fallback-secret")
  let payload: { clientId: string; email: string; orgSlug: string }
  try {
    const result = await jwtVerify(token, secret)
    payload = result.payload as typeof payload
  } catch {
    return NextResponse.json({ error: "Reset link is invalid or expired" }, { status: 400 })
  }

  const passwordHash = await hash(password, 10)
  await prisma.clientPortalUser.updateMany({
    where: { clientId: payload.clientId, email: payload.email },
    data: { passwordHash },
  })

  return NextResponse.json({ ok: true })
}
