import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/admin-auth"
import prisma from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id, status } = await req.json()
  const allowed = ["OPEN", "IN_PROGRESS", "RESOLVED"]
  if (!id || !allowed.includes(status)) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 })
  }

  await prisma.issueReport.update({ where: { id }, data: { status } })
  return NextResponse.json({ ok: true })
}
