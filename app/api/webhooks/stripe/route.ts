import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import prisma from "@/lib/db"
import { sendPaymentReceivedEmail, sendPaymentReceiptEmail } from "@/lib/email"

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

  async function markInvoicePaid(invoiceId: string, orgId: string, gatewayPaymentId: string) {
    const inv = await prisma.invoice.findUnique({
      where: { id: invoiceId, orgId },
      select: { status: true, amountDue: true, currency: true, clientId: true },
    })
    if (!inv || inv.status === "PAID") return

    const [updatedInvoice] = await prisma.$transaction([
      prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: "PAID", paidAt: new Date(), amountPaid: inv.amountDue, amountDue: 0 },
        include: { client: true },
      }),
      prisma.payment.create({
        data: {
          orgId,
          invoiceId,
          clientId: inv.clientId,
          amount: inv.amountDue,
          currency: inv.currency,
          method: "STRIPE",
          gatewayPaymentId,
          status: "succeeded",
          paidAt: new Date(),
        },
      }),
    ])

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true, email: true, orgUsers: { where: { role: "OWNER" }, select: { user: { select: { email: true } } }, take: 1 } },
    })
    const staffEmail = org?.email ?? org?.orgUsers[0]?.user?.email
    const amount = Number(inv.amountDue)
    const currency = String(inv.currency)
    const invoiceNum = (updatedInvoice as unknown as { invoiceNumber: string }).invoiceNumber ?? invoiceId
    const clientData = (updatedInvoice as unknown as { client: { name: string; email: string | null } }).client

    if (staffEmail) {
      sendPaymentReceivedEmail(invoiceNum, clientData.name, amount, currency, staffEmail, org?.name ?? "BillingBee").catch(() => {})
    }
    if (clientData.email) {
      sendPaymentReceiptEmail(invoiceNum, org?.name ?? "BillingBee", amount, currency, clientData.name, clientData.email).catch(() => {})
    }
  }

  switch (event.type) {
    // Primary: checkout session completed (always fires for Stripe Checkout payments)
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.payment_status === "paid") {
        const { invoiceId, orgId } = session.metadata ?? {}
        if (invoiceId && orgId) {
          await markInvoicePaid(invoiceId, orgId, session.payment_intent as string ?? session.id)
        }
      }
      break
    }

    // Fallback: payment intent succeeded (covers direct PI payments + has metadata via payment_intent_data)
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent
      const { invoiceId, orgId } = pi.metadata
      if (invoiceId && orgId) {
        await markInvoicePaid(invoiceId, orgId, pi.id)
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
