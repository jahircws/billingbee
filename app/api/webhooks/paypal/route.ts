import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { sendPaymentReceivedEmail, sendPaymentReceiptEmail } from "@/lib/email"
import { cancelCollections } from "@/app/actions/collections"

async function getPaypalAccessToken(clientId: string, clientSecret: string, base: string) {
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  })
  const data = await res.json()
  return data.access_token as string
}

export async function POST(req: NextRequest) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  if (!webhookId) {
    console.error("PAYPAL_WEBHOOK_ID is not set — webhook handler disabled")
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    console.error("PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET is not set")
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  const mode = process.env.PAYPAL_MODE ?? "sandbox"
  const base = mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"

  const body = await req.json()

  const accessToken = await getPaypalAccessToken(clientId, clientSecret, base)

  const verifyRes = await fetch(`${base}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: req.headers.get("paypal-auth-algo"),
      cert_url: req.headers.get("paypal-cert-url"),
      transmission_id: req.headers.get("paypal-transmission-id"),
      transmission_sig: req.headers.get("paypal-transmission-sig"),
      transmission_time: req.headers.get("paypal-transmission-time"),
      webhook_id: webhookId,
      webhook_event: body,
    }),
  })

  const verifyData = await verifyRes.json()
  if (verifyData.verification_status !== "SUCCESS") {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 })
  }

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

        // TODO: if capture-order endpoint already ran, emails may send twice — add idempotency guard
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
          console.error("Post-payment side effects failed (paypal webhook):", err)
        }
      }
    }
  }

  return NextResponse.json({ received: true })
}
