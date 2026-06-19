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

  const { priceId } = await req.json()
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "")
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://billingbee.co"

  const org = await prisma.organization.findUnique({ where: { id: orgId } })
  if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 })

  // Find or create Stripe customer
  let customerId = org.stripeCustomerId ?? undefined
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: org.email ?? undefined,
      name: org.name,
      metadata: { orgId },
    })
    customerId = customer.id
    await prisma.organization.update({ where: { id: orgId }, data: { stripeCustomerId: customerId } })
  }

  const resolvedPriceId = priceId ?? process.env.STRIPE_PRICE_PRO_MONTHLY
  if (!resolvedPriceId) {
    return NextResponse.json({ error: "Stripe price not configured" }, { status: 500 })
  }

  let session
  try {
    session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: resolvedPriceId, quantity: 1 }],
      subscription_data: { metadata: { orgId } },
      success_url: `${base}/dashboard?upgraded=true`,
      cancel_url: `${base}/dashboard`,
    })
  } catch (err) {
    console.error("[stripe/checkout]", err)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }

  return NextResponse.json({ url: session.url })
}
