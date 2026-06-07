import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import prisma from "@/lib/db"

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sig = req.headers.get("stripe-signature") ?? ""
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? ""
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_placeholder")

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent
      const { invoiceId, orgId } = pi.metadata
      if (invoiceId && orgId) {
        const inv = await prisma.invoice.findUnique({
          where: { id: invoiceId, orgId },
          select: { status: true, amountDue: true, currency: true, clientId: true },
        })
        if (inv && inv.status !== "PAID") {
          await prisma.$transaction([
            prisma.invoice.update({
              where: { id: invoiceId },
              data: { status: "PAID", paidAt: new Date(), amountPaid: inv.amountDue, amountDue: 0 },
            }),
            prisma.payment.create({
              data: {
                orgId,
                invoiceId,
                clientId: inv.clientId,
                amount: inv.amountDue,
                currency: inv.currency,
                method: "STRIPE",
                gatewayPaymentId: pi.id,
                status: "succeeded",
                paidAt: new Date(),
              },
            }),
          ])
        }
      }
      break
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription
      const orgId = sub.metadata?.orgId
      if (orgId) {
        const plan = sub.status === "active" ? "pro" : "free"
        const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end
        const expiry = periodEnd ? new Date(periodEnd * 1000) : null
        await prisma.organization.update({
          where: { id: orgId },
          data: { plan, planExpiry: expiry },
        })
      }
      break
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription
      const orgId = sub.metadata?.orgId
      if (orgId) {
        await prisma.organization.update({
          where: { id: orgId },
          data: { plan: "free", planExpiry: null },
        })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
