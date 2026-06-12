import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { hash } from "bcryptjs"
import prisma from "@/lib/db"
import { validatePassword } from "@/lib/sanitize"

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()
  if (!token || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  const passwordError = validatePassword(password)
  if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 })

  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET ?? "fallback-secret")
  let payload: { userId: string; email: string }
  try {
    const result = await jwtVerify(token, secret)
    payload = result.payload as typeof payload
  } catch {
    return NextResponse.json({ error: "Reset link is invalid or expired" }, { status: 400 })
  }

  const passwordHash = await hash(password, 12)
  await prisma.user.update({
    where: { id: payload.userId },
    data: { passwordHash },
  })

  return NextResponse.json({ ok: true })
}
