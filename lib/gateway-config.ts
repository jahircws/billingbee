import prisma from "@/lib/db"
import { decrypt } from "@/lib/crypto"

export interface RazorpayConfig { keyId: string; keySecret: string }
export interface StripeConfig { publishableKey: string; secretKey: string; webhookSecret?: string }
export interface PaypalConfig { clientId: string; clientSecret: string; mode: "sandbox" | "live" }

export async function getRazorpayConfig(orgId: string): Promise<RazorpayConfig> {
  const row = await prisma.paymentGatewayConfig.findUnique({
    where: { orgId_gateway: { orgId, gateway: "RAZORPAY" } },
  })
  if (!row?.isActive) throw new Error("Razorpay not configured")
  const cfg = JSON.parse(decrypt(row.encryptedConfig))
  return { keyId: cfg.keyId, keySecret: cfg.keySecret }
}

export async function getStripeConfig(orgId: string): Promise<StripeConfig> {
  const row = await prisma.paymentGatewayConfig.findUnique({
    where: { orgId_gateway: { orgId, gateway: "STRIPE" } },
  })
  if (!row?.isActive) throw new Error("Stripe not configured")
  const cfg = JSON.parse(decrypt(row.encryptedConfig))
  return { publishableKey: cfg.publishableKey, secretKey: cfg.secretKey, webhookSecret: row.webhookSecret ?? undefined }
}

export async function getPaypalConfig(orgId: string): Promise<PaypalConfig> {
  const row = await prisma.paymentGatewayConfig.findUnique({
    where: { orgId_gateway: { orgId, gateway: "PAYPAL" } },
  })
  if (!row?.isActive) throw new Error("PayPal not configured")
  const cfg = JSON.parse(decrypt(row.encryptedConfig))
  const mode = (process.env.PAYPAL_MODE ?? "sandbox") as "sandbox" | "live"
  return { clientId: cfg.clientId, clientSecret: cfg.clientSecret, mode }
}

export async function getConfiguredGateways(orgId: string): Promise<string[]> {
  const rows = await prisma.paymentGatewayConfig.findMany({
    where: { orgId, isActive: true },
    select: { gateway: true },
  })
  return rows.map((r) => r.gateway)
}
