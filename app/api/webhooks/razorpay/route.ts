import { NextRequest, NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"
import prisma from "@/lib/db"

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sig = req.headers.get("x-razorpay-signature") ?? ""
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? ""

  if (secret) {
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex")
    const expectedBuf = Buffer.from(expected, "hex")
    const actualBuf = Buffer.from(sig, "hex")
    if (
      expectedBuf.length !== actualBuf.length ||
      !timingSafeEqual(expectedBuf, actualBuf)
    ) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }
  }

  const event = JSON.parse(rawBody)

  if (event.event === "payment.captured") {
    const payment = event.payload?.payment?.entity
    const invoiceId = payment?.notes?.invoiceId
    const orgId = payment?.notes?.orgId
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
              method: "RAZORPAY",
              gatewayPaymentId: payment.id,
              gatewayOrderId: payment.order_id,
              status: "captured",
              paidAt: new Date(),
            },
          }),
        ])
      }
    }
  }

  return NextResponse.json({ received: true })
}
