import { NextRequest, NextResponse } from "next/server"
import { getOrgId } from "@/lib/session"
import prisma from "@/lib/db"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let orgId: string
  try { orgId = await getOrgId() } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }

  const { id } = await params
  const body = await req.json()
  const item = await prisma.item.updateMany({
    where: { id, orgId },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.description !== undefined ? { description: body.description || null } : {}),
      ...(body.unitPrice !== undefined ? { unitPrice: body.unitPrice } : {}),
      ...(body.taxRate !== undefined ? { taxRate: body.taxRate } : {}),
      ...(body.unit !== undefined ? { unit: body.unit || null } : {}),
      ...(body.hsn !== undefined ? { hsn: body.hsn || null } : {}),
    },
  })
  if (!item.count) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const updated = await prisma.item.findUnique({ where: { id } })
  return NextResponse.json({ item: updated })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let orgId: string
  try { orgId = await getOrgId() } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }

  const { id } = await params
  await prisma.item.updateMany({ where: { id, orgId }, data: { isActive: false } })
  return NextResponse.json({ ok: true })
}
