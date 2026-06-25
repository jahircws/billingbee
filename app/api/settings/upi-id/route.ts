import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import db from "@/lib/db"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const orgId = session.user.orgId

  const body = await req.json()
  const raw = typeof body.upiId === "string" ? body.upiId.trim() : ""

  if (!raw || !raw.includes("@")) {
    return NextResponse.json({ error: "Enter a valid UPI ID (e.g. yourname@okicici)" }, { status: 400 })
  }
  if (raw.length > 50) {
    return NextResponse.json({ error: "UPI ID must be 50 characters or fewer" }, { status: 400 })
  }

  await db.organization.update({ where: { id: orgId }, data: { upiId: raw } })
  return NextResponse.json({ success: true })
}

export async function DELETE(_req: NextRequest) {
  const session = await auth()
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const orgId = session.user.orgId

  await db.organization.update({ where: { id: orgId }, data: { upiId: null } })
  return NextResponse.json({ success: true })
}
