import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/db"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, email } = await req.json()
  const data: { name: string | null; email?: string } = { name: name || null }
  if (typeof email === "string" && email.trim() && !email.includes("@billingbee.internal")) {
    data.email = email.trim().toLowerCase()
  }
  await prisma.user.update({ where: { id: session.user.userId }, data })
  return NextResponse.json({ ok: true })
}
