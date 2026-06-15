import { NextRequest, NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"
import prisma from "@/lib/db"
import { sendPaymentReceivedEmail, sendPaymentReceiptEmail } from "@/lib/email"
import { cancelCollections } from "@/app/actions/collections"

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sig = req.headers.get("x-razorpay-signature") ?? ""
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET

  if (!secret) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not set — webhook handler disabled")
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex")
  const expectedBuf = Buffer.from(expected, "hex")
  const actualBuf = Buffer.from(sig, "hex")
  if (
    expectedBuf.length !== actualBuf.length ||
    !timingSafeEqual(expectedBuf, actualBuf)
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
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

        // TODO: if verify endpoint already ran, emails may send twice — add idempotency guard
        try {
          await cancelCollections(orgId, invoiceId)

          const [invoiceData, org] = await Promise.all([
            prisma.invoice.findUnique({
              where: { id: invoiceId, orgId },
              select: { invoiceNumber: true, client: { select: { name: true, email: true } } },
            }),
            prisma.organization.findUnique({
              where: { id: orgId },
              select: { name: true, email: true, orgUsers: { where: { role: "OWNER" }, select: { user: { select: { email: true } } }, take: 1 } },
            }),
          ])

          const amount = Number(inv.amountDue)
          const currency = String(inv.currency)
          const invoiceNum = invoiceData?.invoiceNumber ?? invoiceId
          const clientData = invoiceData?.client
          const staffEmail = org?.email ?? org?.orgUsers[0]?.user?.email
          const orgName = org?.name ?? "BillingBee"

          if (staffEmail && clientData) {
            sendPaymentReceivedEmail(invoiceNum, clientData.name, amount, currency, staffEmail, orgName, invoiceId).catch(() => {})
          }
          if (clientData?.email) {
            sendPaymentReceiptEmail(invoiceNum, orgName, amount, currency, clientData.name, clientData.email).catch(() => {})
          }
        } catch (err) {
          console.error("Post-payment side effects failed (razorpay webhook):", err)
        }
      }
    }
  }

  return NextResponse.json({ received: true })
}
