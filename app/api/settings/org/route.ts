import { NextRequest, NextResponse } from "next/server"
import { getOrgId } from "@/lib/session"
import prisma from "@/lib/db"

export async function POST(req: NextRequest) {
  let orgId: string
  try { orgId = await getOrgId() } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }

  const body = await req.json()
  const { name, email, phone, address, city, state, country, pincode, gstin, pan, currency } = body

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      ...(name ? { name } : {}),
      email: email || null,
      phone: phone || null,
      address: address || null,
      city: city || null,
      state: state || null,
      ...(country ? { country } : {}),
      pincode: pincode || null,
      gstin: gstin || null,
      pan: pan || null,
      ...(currency ? { currency: currency as never } : {}),
    },
  })
  return NextResponse.json({ ok: true })
}
