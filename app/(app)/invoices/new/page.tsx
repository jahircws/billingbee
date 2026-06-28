import { redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { Topbar } from "@/components/layout/Topbar"
import InvoiceForm from "@/components/invoices/InvoiceForm"
import { privateMetadata } from "@/lib/metadata"
import OnboardingCopilotTrigger from "./OnboardingCopilotTrigger"

export const metadata = { ...privateMetadata, title: "New Invoice" }
export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<{
    clientId?: string
    clientName?: string
    amount?: string
    description?: string
    dueDate?: string
    currency?: string
    source?: string
    mode?: string
    onboarding?: string
  }>
}

export default async function NewInvoicePage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user?.orgId) redirect("/login")
  const orgId = session.user.orgId

  const { clientId, clientName, amount, description, dueDate, mode, onboarding } = await searchParams

  const [clients, org, taxes, items] = await Promise.all([
    prisma.client.findMany({
      where: { orgId },
      select: { id: true, name: true, email: true, city: true, state: true },
      orderBy: { name: "asc" },
    }),
    prisma.organization.findUnique({ where: { id: orgId }, select: { plan: true, currency: true, state: true } }),
    prisma.tax.findMany({ where: { orgId, isActive: true }, select: { id: true, name: true, rate: true }, orderBy: { name: "asc" } }),
    prisma.item.findMany({ where: { orgId, isActive: true }, select: { id: true, name: true, description: true, unitPrice: true, taxRate: true, hsn: true }, orderBy: { name: "asc" } }),
  ])

  const isPro = org?.plan !== "free"
  const defaultCurrency = org?.currency ?? "INR"
  const orgState = org?.state ?? null

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="New Invoice" />
      {onboarding === "true" && <OnboardingCopilotTrigger clientName={clientName} />}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
        <InvoiceForm
          clients={clients}
          savedItems={items.map((i) => ({ id: i.id, name: i.name, description: i.description, unitPrice: Number(i.unitPrice), taxRate: Number(i.taxRate), hsn: i.hsn }))}
          orgTaxes={taxes.map((t) => ({ id: t.id, name: t.name, rate: Number(t.rate) }))}
          isPro={isPro}
          orgState={orgState}
          defaultClientId={clientId}
          defaultClientName={clientName}
          defaultAmount={amount ? parseFloat(amount) : undefined}
          defaultDescription={description}
          defaultDueDate={dueDate}
          defaultCurrency={defaultCurrency}
          uploadMode={mode === "upload"}
        />
        </div>
      </div>
    </div>
  )
}
