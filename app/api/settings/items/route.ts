import { NextRequest, NextResponse } from "next/server"
import { getOrgId } from "@/lib/session"
import prisma from "@/lib/db"

export async function POST(req: NextRequest) {
  let orgId: string
  try { orgId = await getOrgId() } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }

  const { name, description, unitPrice, taxRate, unit, hsn } = await req.json()
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 })

  const item = await prisma.item.create({
    data: { orgId, name, description: description || null, unitPrice: unitPrice ?? 0, taxRate: taxRate ?? 0, unit: unit || null, hsn: hsn || null },
  })
  return NextResponse.json({ item })
}
