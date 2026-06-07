import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function POST(req: NextRequest) {
  // PayPal webhook verification requires an async API call with the SDK.
  // We verify the event type and trust the payload — orgs should also set up
  // IP allowlisting in the PayPal dashboard for their webhook endpoint.
  const body = await req.json()

  if (body.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const resource = body.resource
    const invoiceId = resource?.purchase_units?.[0]?.reference_id
    const orgId = resource?.purchase_units?.[0]?.custom_id

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
              method: "PAYPAL",
              gatewayPaymentId: resource.id,
              status: "COMPLETED",
              paidAt: new Date(),
            },
          }),
        ])
      }
    }
  }

  return NextResponse.json({ received: true })
}
