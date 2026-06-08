import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import prisma from "@/lib/db"
import { getStripeConfig } from "@/lib/gateway-config"
import { verifyPaymentToken } from "@/lib/payment-token"

export async function POST(req: NextRequest) {
  const { invoiceId, token } = await req.json()

  let orgId: string
  try {
    const payload = verifyPaymentToken(token)
    if (payload.invoiceId !== invoiceId) throw new Error("Mismatch")
    orgId = payload.orgId
  } catch {
    return NextResponse.json({ error: "Invalid payment link" }, { status: 401 })
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId, orgId },
    include: { client: { select: { name: true, email: true } } },
  })
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
  if (invoice.status === "PAID") return NextResponse.json({ error: "Already paid" }, { status: 409 })

  const { secretKey } = await getStripeConfig(orgId)
  const stripe = new Stripe(secretKey)

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://billingbee.co"
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: invoice.client.email ?? undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: invoice.currency.toLowerCase(),
          unit_amount: Math.round(Number(invoice.amountDue) * 100),
          product_data: { name: `Invoice ${invoice.invoiceNumber}` },
        },
      },
    ],
    metadata: { invoiceId, orgId },
    payment_intent_data: { metadata: { invoiceId, orgId } },
    success_url: `${base}/pay/${token}?paid=true`,
    cancel_url: `${base}/pay/${token}`,
  })

  return NextResponse.json({ sessionUrl: session.url })
}
