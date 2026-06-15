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
  const [row, org] = await Promise.all([
    prisma.paymentGatewayConfig.findUnique({
      where: { orgId_gateway: { orgId, gateway: "STRIPE" } },
    }),
    prisma.organization.findUnique({ where: { id: orgId }, select: { plan: true } }),
  ])
  if (org?.plan !== "pro") throw new Error("Stripe requires a Pro plan")
  if (!row?.isActive) throw new Error("Stripe not configured")
  const cfg = JSON.parse(decrypt(row.encryptedConfig))
  return { publishableKey: cfg.publishableKey, secretKey: cfg.secretKey, webhookSecret: row.webhookSecret ?? undefined }
}

export async function getPaypalConfig(orgId: string): Promise<PaypalConfig> {
  const [row, org] = await Promise.all([
    prisma.paymentGatewayConfig.findUnique({
      where: { orgId_gateway: { orgId, gateway: "PAYPAL" } },
    }),
    prisma.organization.findUnique({ where: { id: orgId }, select: { plan: true } }),
  ])
  if (org?.plan !== "pro") throw new Error("PayPal requires a Pro plan")
  if (!row?.isActive) throw new Error("PayPal not configured")
  const cfg = JSON.parse(decrypt(row.encryptedConfig))
  const mode = (process.env.PAYPAL_MODE ?? "sandbox") as "sandbox" | "live"
  return { clientId: cfg.clientId, clientSecret: cfg.clientSecret, mode }
}

export async function getConfiguredGateways(orgId: string): Promise<string[]> {
  const [rows, org] = await Promise.all([
    prisma.paymentGatewayConfig.findMany({
      where: { orgId, isActive: true },
      select: { gateway: true },
    }),
    prisma.organization.findUnique({ where: { id: orgId }, select: { plan: true } }),
  ])
  const isPro = org?.plan === "pro"
  return rows
    .map((r) => r.gateway)
    .filter((g) => isPro || (g !== "STRIPE" && g !== "PAYPAL"))
}
