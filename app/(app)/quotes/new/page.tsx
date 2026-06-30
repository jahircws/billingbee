import { redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { Topbar } from "@/components/layout/Topbar"
import QuoteConversationFlow from "@/components/quotes/QuoteConversationFlow"
import { privateMetadata } from "@/lib/metadata"
import Link from "next/link"
import { Info } from "lucide-react"

export const metadata = { ...privateMetadata, title: "New Quote" }
export const dynamic = "force-dynamic"

export default async function NewQuotePage() {
  const session = await auth()
  if (!session?.user?.orgId) redirect("/login")
  const orgId = session.user.orgId

  const [clients, org, items, taxes] = await Promise.all([
    prisma.client.findMany({
      where: { orgId },
      select: { id: true, name: true, email: true, city: true, state: true },
      orderBy: { name: "asc" },
    }),
    prisma.organization.findUnique({ where: { id: orgId }, select: { plan: true, logo: true, currency: true } }),
    prisma.item.findMany({
      where: { orgId, isActive: true },
      select: { id: true, name: true, description: true, unitPrice: true, taxRate: true, hsn: true },
      orderBy: { name: "asc" },
    }),
    prisma.tax.findMany({ where: { orgId, isActive: true }, select: { id: true, name: true, rate: true }, orderBy: { name: "asc" } }),
  ])

  const isPro = org?.plan !== "free"
  const hasLogo = !!org?.logo

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="New Quote" showBack backHref="/quotes" />
      <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-2xl mx-auto w-full pb-20 md:pb-6 space-y-4">
        {!hasLogo && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm flex items-start gap-2">
            <Info size={16} className="text-amber-500 mt-0.5 shrink-0" />
            <span className="flex-1">
              Your quotes will show your business name instead of a logo.{" "}
              <Link href="/settings?tab=org" className="underline font-medium">Upload logo in Settings →</Link>
            </span>
          </div>
        )}
        <QuoteConversationFlow
          clients={clients}
          isPro={isPro}
          savedItems={items.map((i) => ({ id: i.id, name: i.name, description: i.description, unitPrice: Number(i.unitPrice), taxRate: Number(i.taxRate), hsn: i.hsn }))}
          orgTaxes={taxes.map((t) => ({ id: t.id, name: t.name, rate: Number(t.rate) }))}
        />
      </div>
    </div>
  )
}
