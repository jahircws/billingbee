import { NextRequest, NextResponse } from "next/server"
import Razorpay from "razorpay"
import prisma from "@/lib/db"
import { getRazorpayConfig } from "@/lib/gateway-config"
import { verifyPaymentToken } from "@/lib/payment-token"

export async function POST(req: NextRequest) {
  const { invoiceId, token } = await req.json()
  if (!invoiceId || !token) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

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
