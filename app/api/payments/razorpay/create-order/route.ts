import { NextRequest, NextResponse } from "next/server"
import Razorpay from "razorpay"
import { z } from "zod"
import prisma from "@/lib/db"
import { getRazorpayConfig } from "@/lib/gateway-config"
import { verifyPaymentToken } from "@/lib/payment-token"

const schema = z.object({
  invoiceId: z.string().min(1),
  token: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  const { invoiceId, token } = parsed.data

  let orgId: string
  try {
    const payload = verifyPaymentToken(token)
    if (payload.invoiceId !== invoiceId) throw new Error("Token mismatch")
    orgId = payload.orgId
  } catch {
    return NextResponse.json({ error: "Invalid payment link" }, { status: 401 })
  }

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId, orgId } })
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
  if (invoice.status === "PAID") return NextResponse.json({ error: "Already paid" }, { status: 409 })

  const { keyId, keySecret } = await getRazorpayConfig(orgId)
  const rz = new Razorpay({ key_id: keyId, key_secret: keySecret })

  const amountPaise = Math.round(Number(invoice.amountDue) * 100)
  const order = await rz.orders.create({
    amount: amountPaise,
    currency: invoice.currency,
    receipt: invoice.invoiceNumber,
    notes: { invoiceId, orgId },
  })

  return NextResponse.json({ orderId: order.id, amount: amountPaise, currency: invoice.currency, keyId })
}
