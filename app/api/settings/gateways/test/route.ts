import { NextRequest, NextResponse } from "next/server"
import { getOrgId } from "@/lib/session"
import { getRazorpayConfig, getStripeConfig, getPaypalConfig } from "@/lib/gateway-config"
import Razorpay from "razorpay"
import Stripe from "stripe"

export async function POST(req: NextRequest) {
  let orgId: string
  try {
    orgId = await getOrgId()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { gateway } = await req.json()

  try {
    if (gateway === "RAZORPAY") {
      const { keyId, keySecret } = await getRazorpayConfig(orgId)
      const rz = new Razorpay({ key_id: keyId, key_secret: keySecret })
      await rz.orders.all({ count: 1 })
      return NextResponse.json({ message: "Razorpay connection successful ✓" })
    }

    if (gateway === "STRIPE") {
      const { secretKey } = await getStripeConfig(orgId)
      const stripe = new Stripe(secretKey)
      await stripe.balance.retrieve()
      return NextResponse.json({ message: "Stripe connection successful ✓" })
    }

    if (gateway === "PAYPAL") {
      const { clientId, clientSecret, mode } = await getPaypalConfig(orgId)
      const base = mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"
      const res = await fetch(`${base}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      })
      if (!res.ok) throw new Error("Invalid credentials")
      return NextResponse.json({ message: "PayPal connection successful ✓" })
    }

    return NextResponse.json({ error: "Unknown gateway" }, { status: 400 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Connection test failed" },
      { status: 400 }
    )
  }
}
