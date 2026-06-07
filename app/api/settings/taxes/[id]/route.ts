import { NextRequest, NextResponse } from "next/server"
import { getOrgId } from "@/lib/session"
import prisma from "@/lib/db"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let orgId: string
  try { orgId = await getOrgId() } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }

  const { id } = await params
  await prisma.tax.updateMany({ where: { id, orgId }, data: { isActive: false } })
  return NextResponse.json({ ok: true })
}
