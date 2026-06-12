import { NextRequest, NextResponse } from "next/server"
import { getOrgId } from "@/lib/session"
import prisma from "@/lib/db"

export async function POST(req: NextRequest) {
  let orgId: string
  try { orgId = await getOrgId() } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }

  const body = await req.json()
  const { name, email, phone, address, city, state, country, pincode, gstin, pan, currency, logo } = body

  // Logo is stored inline as a resized data URL (the client caps it to ~256px).
  // Validate it's an image data URL and reject anything oversized to protect the DB.
  let logoValue: string | null | undefined
  if (logo !== undefined) {
    if (!logo) {
      logoValue = null
    } else if (typeof logo === "string" && /^data:image\/(png|jpeg|webp|svg\+xml);/.test(logo) && logo.length <= 1_500_000) {
      logoValue = logo
    } else {
      return NextResponse.json({ error: "Invalid logo" }, { status: 400 })
    }
  }

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
      ...(logoValue !== undefined ? { logo: logoValue } : {}),
    },
  })
  return NextResponse.json({ ok: true })
}
