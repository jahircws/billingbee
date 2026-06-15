import { NextRequest, NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"
import { z } from "zod"
import prisma from "@/lib/db"
import { getRazorpayConfig } from "@/lib/gateway-config"
import { verifyPaymentToken } from "@/lib/payment-token"
import { sendPaymentReceivedEmail, sendPaymentReceiptEmail } from "@/lib/email"
import { cancelCollections } from "@/app/actions/collections"

const schema = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  signature: z.string().min(1),
  invoiceId: z.string().min(1),
  token: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  const { orderId, paymentId, signature, invoiceId, token } = parsed.data

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

  // TODO: if both verify and webhook fire, emails may send twice — add idempotency guard
  try {
    await cancelCollections(orgId, invoiceId)

    const [inv, org] = await Promise.all([
      prisma.invoice.findUnique({
        where: { id: invoiceId, orgId },
        select: { invoiceNumber: true, client: { select: { name: true, email: true } } },
      }),
      prisma.organization.findUnique({
        where: { id: orgId },
        select: { name: true, email: true, orgUsers: { where: { role: "OWNER" }, select: { user: { select: { email: true } } }, take: 1 } },
      }),
    ])

    const amount = Number(invoice.amountDue)
    const currency = String(invoice.currency)
    const invoiceNum = inv?.invoiceNumber ?? invoiceId
    const clientData = inv?.client
    const staffEmail = org?.email ?? org?.orgUsers[0]?.user?.email
    const orgName = org?.name ?? "BillingBee"

    if (staffEmail && clientData) {
      sendPaymentReceivedEmail(invoiceNum, clientData.name, amount, currency, staffEmail, orgName, invoiceId).catch(() => {})
    }
    if (clientData?.email) {
      sendPaymentReceiptEmail(invoiceNum, orgName, amount, currency, clientData.name, clientData.email).catch(() => {})
    }
  } catch (err) {
    console.error("Post-payment side effects failed (razorpay verify):", err)
  }

  return NextResponse.json({ success: true })
}
