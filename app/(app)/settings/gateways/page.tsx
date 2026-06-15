import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/db"
import { decrypt } from "@/lib/crypto"
import { privateMetadata } from "@/lib/metadata"
import { Topbar } from "@/components/layout/Topbar"
import GatewayForm from "./GatewayForm"

export const metadata = { ...privateMetadata, title: "Payment Gateways" }
export const dynamic = "force-dynamic"

async function loadGatewayStatus(orgId: string) {
  const rows = await prisma.paymentGatewayConfig.findMany({ where: { orgId } })
  const map: Record<string, { isActive: boolean; keyId?: string; webhookSecret?: string }> = {}
  for (const row of rows) {
    try {
      const cfg = JSON.parse(decrypt(row.encryptedConfig))
      map[row.gateway] = {
        isActive: row.isActive,
        keyId: cfg.keyId ?? cfg.publishableKey ?? cfg.clientId,
        webhookSecret: row.webhookSecret ?? undefined,
      }
    } catch {
      map[row.gateway] = { isActive: false }
    }
  }
  return map
}

export default async function GatewaysPage() {
  const session = await auth()
  if (!session?.user?.orgId) redirect("/login")
  const orgId = session.user.orgId

  const [status, org] = await Promise.all([
    loadGatewayStatus(orgId),
    prisma.organization.findUnique({ where: { id: orgId }, select: { plan: true } }),
  ])

  const isPro = org?.plan === "pro"
  const appUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://billingbee.co"

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Payment Gateways" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Payment Gateways</h2>
            <p className="text-sm text-gray-500 mt-1">
              Keys are encrypted with AES-256-GCM before storage. We never log them.
            </p>
          </div>

          <GatewayForm
            gateway="RAZORPAY"
            label="Razorpay"
            status={status["RAZORPAY"]}
            fields={["keyId", "keySecret"]}
            labels={["Key ID", "Key Secret"]}
            webhookUrl={`${appUrl}/api/webhooks/razorpay`}
          />
          <GatewayForm
            gateway="STRIPE"
            label="Stripe"
            status={status["STRIPE"]}
            fields={["publishableKey", "secretKey"]}
            labels={["Publishable Key", "Secret Key"]}
            webhookUrl={`${appUrl}/api/webhooks/stripe`}
            webhookSecretField
            locked={!isPro}
          />
          <GatewayForm
            gateway="PAYPAL"
            label="PayPal"
            status={status["PAYPAL"]}
            fields={["clientId", "clientSecret"]}
            labels={["Client ID", "Client Secret"]}
            webhookUrl={`${appUrl}/api/webhooks/paypal`}
            locked={!isPro}
          />
        </div>
      </div>
    </div>
  )
}
