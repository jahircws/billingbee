import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/db"
import { getPaypalConfig } from "@/lib/gateway-config"
import { verifyPaymentToken } from "@/lib/payment-token"

const schema = z.object({
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
  const { invoiceId, token } = parsed.data

  let orgId: string
  try {
    const payload = verifyPaymentToken(token)
    if (payload.invoiceId !== invoiceId) throw new Error("Mismatch")
    orgId = payload.orgId
  } catch {
    return NextResponse.json({ error: "Invalid payment link" }, { status: 401 })
  }

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId, orgId } })
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
  if (invoice.status === "PAID") return NextResponse.json({ error: "Already paid" }, { status: 409 })

  const { clientId, clientSecret, mode } = await getPaypalConfig(orgId)
  const { accessToken, base } = await getPaypalAccessToken(clientId, clientSecret, mode)

  const ppBase = process.env.NEXT_PUBLIC_BASE_URL ?? "https://billingbee.co"
  const res = await fetch(`${base}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `${invoiceId}-${Date.now()}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: invoiceId,
          custom_id: orgId,
          amount: {
            currency_code: invoice.currency === "INR" ? "USD" : invoice.currency, // PayPal doesn't support INR
            value: Number(invoice.amountDue).toFixed(2),
          },
          description: `Invoice ${invoice.invoiceNumber}`,
        },
      ],
      application_context: {
        return_url: `${ppBase}/pay/${token}?paid=true`,
        cancel_url: `${ppBase}/pay/${token}`,
      },
    }),
  })

  const order = await res.json()
  return NextResponse.json({ id: order.id })
}
