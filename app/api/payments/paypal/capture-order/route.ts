import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/db"
import { getPaypalConfig } from "@/lib/gateway-config"
import { verifyPaymentToken } from "@/lib/payment-token"

const schema = z.object({
  orderId: z.string().min(1),
  invoiceId: z.string().min(1),
  token: z.string().min(1),
})

async function getPaypalAccessToken(clientId: string, clientSecret: string, mode: string) {
  const base = mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  })
  const data = await res.json()
  return { accessToken: data.access_token as string, base }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  const { orderId, invoiceId, token } = parsed.data

  let orgId: string
  try {
    const payload = verifyPaymentToken(token)
    if (payload.invoiceId !== invoiceId) throw new Error("Mismatch")
    orgId = payload.orgId
  } catch {
    return NextResponse.json({ error: "Invalid payment link" }, { status: 401 })
  }

  const { clientId, clientSecret, mode } = await getPaypalConfig(orgId)
  const { accessToken, base } = await getPaypalAccessToken(clientId, clientSecret, mode)

  const res = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
  })
  const capture = await res.json()

  if (capture.status !== "COMPLETED") {
    return NextResponse.json({ error: "Payment not completed" }, { status: 400 })
  }

  const inv = await prisma.invoice.findUnique({
    where: { id: invoiceId, orgId },
    select: { status: true, amountDue: true, currency: true, clientId: true },
  })
  if (!inv) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
  if (inv.status === "PAID") return NextResponse.json({ success: true })

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
        gatewayPaymentId: capture.id,
        gatewayOrderId: orderId,
        status: "COMPLETED",
        paidAt: new Date(),
      },
    }),
  ])

  return NextResponse.json({ success: true })
}
