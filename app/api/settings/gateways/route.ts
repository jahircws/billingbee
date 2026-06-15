import { NextRequest, NextResponse } from "next/server"
import { getOrgId } from "@/lib/session"
import { encrypt } from "@/lib/crypto"
import prisma from "@/lib/db"

const VALID_GATEWAYS = new Set(["RAZORPAY", "STRIPE", "PAYPAL"])

export async function POST(req: NextRequest) {
  let orgId: string
  try {
    orgId = await getOrgId()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { gateway, config, webhookSecret } = await req.json()
  if (!gateway || !VALID_GATEWAYS.has(gateway) || !config) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const encryptedConfig = encrypt(JSON.stringify(config))
  const webhookSecretValue = typeof webhookSecret === "string" && webhookSecret.trim()
    ? webhookSecret.trim()
    : undefined

  await prisma.paymentGatewayConfig.upsert({
    where: { orgId_gateway: { orgId, gateway } },
    create: { orgId, gateway, encryptedConfig, isActive: true, ...(webhookSecretValue ? { webhookSecret: webhookSecretValue } : {}) },
    update: { encryptedConfig, isActive: true, ...(webhookSecretValue ? { webhookSecret: webhookSecretValue } : {}) },
  })

  return NextResponse.json({ message: `${gateway} saved successfully` })
}
