import { NextRequest, NextResponse } from "next/server"
import { getOrgId } from "@/lib/session"
import prisma from "@/lib/db"

export async function POST(req: NextRequest) {
  let orgId: string
  try { orgId = await getOrgId() } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }

  const { name, rate } = await req.json()
  if (!name || rate === undefined) return NextResponse.json({ error: "name and rate required" }, { status: 400 })

  const tax = await prisma.tax.create({ data: { orgId, name, rate } })
  return NextResponse.json({ tax })
}
