import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getOrgId } from "@/lib/session"
import prisma from "@/lib/db"

export async function POST(req: NextRequest) {
  let orgId: string
  try {
    orgId = await getOrgId()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const org = await prisma.organization.findUnique({ where: { id: orgId } })
  if (!org?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account found" }, { status: 404 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "")
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://billingbee.co"

  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${base}/dashboard/settings`,
  })

  return NextResponse.json({ url: session.url })
}
