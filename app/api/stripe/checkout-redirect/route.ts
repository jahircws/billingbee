import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import Stripe from "stripe"
import prisma from "@/lib/db"

export async function GET(req: NextRequest) {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://billingbee.co"
  const { searchParams } = req.nextUrl

  // If not logged in, send to register then come back here
  const session = await auth()
  if (!session?.user?.orgId) {
    const callbackUrl = encodeURIComponent(`/api/stripe/checkout-redirect?${searchParams.toString()}`)
    return NextResponse.redirect(`${base}/register?callbackUrl=${callbackUrl}`)
  }

  const orgId = session.user.orgId
  const plan = searchParams.get("plan") ?? "pro"
  const priceId = plan === "business"
    ? (process.env.STRIPE_PRICE_BUSINESS_MONTHLY ?? process.env.STRIPE_PRICE_PRO_MONTHLY ?? "")
    : (process.env.STRIPE_PRICE_PRO_MONTHLY ?? "")

  if (!priceId) {
    // Fallback to settings page if price not configured
    return NextResponse.redirect(`${base}/settings?tab=plan`)
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "")

  const org = await prisma.organization.findUnique({ where: { id: orgId } })
  if (!org) return NextResponse.redirect(`${base}/settings?tab=plan`)

  // Already on a paid plan — send to billing portal
  if (org.plan === "pro" || org.plan === "business") {
    if (org.stripeCustomerId) {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: org.stripeCustomerId,
        return_url: `${base}/settings?tab=plan`,
      })
      return NextResponse.redirect(portalSession.url)
    }
    return NextResponse.redirect(`${base}/settings?tab=plan`)
  }

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

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: { metadata: { orgId } },
    success_url: `${base}/dashboard?upgraded=true`,
    cancel_url: `${base}/plans-price`,
  })

  return NextResponse.redirect(checkoutSession.url!)
}
