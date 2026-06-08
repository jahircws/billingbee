import { redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { Topbar } from "@/components/layout/Topbar"
import InvoiceForm from "@/components/invoices/InvoiceForm"
import { privateMetadata } from "@/lib/metadata"

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
  }>
}

export default async function NewInvoicePage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user?.orgId) redirect("/login")
  const orgId = session.user.orgId

  const { clientId, clientName, amount, description, dueDate } = await searchParams

  const [clients, org] = await Promise.all([
    prisma.client.findMany({
      where: { orgId },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.organization.findUnique({ where: { id: orgId }, select: { plan: true } }),
  ])

  const isPro = org?.plan !== "free"

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="New Invoice" />
      <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-2xl mx-auto w-full pb-20 md:pb-6">
        <InvoiceForm
          clients={clients}
          isPro={isPro}
          defaultClientId={clientId}
          defaultClientName={clientName}
          defaultAmount={amount ? parseFloat(amount) : undefined}
          defaultDescription={description}
          defaultDueDate={dueDate}
        />
      </div>
    </div>
  )
}
