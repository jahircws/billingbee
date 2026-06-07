import { NextRequest, NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"
import prisma from "@/lib/db"
import { getRazorpayConfig } from "@/lib/gateway-config"
import { verifyPaymentToken } from "@/lib/payment-token"

export async function POST(req: NextRequest) {
  const { orderId, paymentId, signature, invoiceId, token } = await req.json()

  let orgId: string
  try {
    const payload = verifyPaymentToken(token)
    if (payload.invoiceId !== invoiceId) throw new Error("Mismatch")
    orgId = payload.orgId
  } catch {
    return NextResponse.json({ error: "Invalid payment link" }, { status: 401 })
  }

  const { keySecret } = await getRazorpayConfig(orgId)

  const expected = createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex")

  const expectedBuf = Buffer.from(expected, "hex")
  const actualBuf = Buffer.from(signature, "hex")

  if (
    expectedBuf.length !== actualBuf.length ||
    !timingSafeEqual(expectedBuf, actualBuf)
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId, orgId },
    select: { id: true, amountDue: true, currency: true, clientId: true, status: true },
  })
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
  if (invoice.status === "PAID") return NextResponse.json({ success: true }) // idempotent

  await prisma.$transaction([
    prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "PAID", paidAt: new Date(), amountPaid: invoice.amountDue, amountDue: 0 },
    }),
    prisma.payment.create({
      data: {
        orgId,
        invoiceId,
        clientId: invoice.clientId,
        amount: invoice.amountDue,
        currency: invoice.currency,
        method: "RAZORPAY",
        gatewayPaymentId: paymentId,
        gatewayOrderId: orderId,
        gatewaySignature: signature,
        status: "captured",
        paidAt: new Date(),
      },
    }),
  ])

  return NextResponse.json({ success: true })
}
