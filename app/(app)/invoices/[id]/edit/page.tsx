import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { serialize } from "@/lib/serialize"
import { Topbar } from "@/components/layout/Topbar"
import InvoiceForm from "@/components/invoices/InvoiceForm"
import { privateMetadata } from "@/lib/metadata"
import { format } from "date-fns"
import { getTaxLabel } from "@/lib/utils"

export const metadata = { ...privateMetadata, title: "Edit Invoice" }
export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditInvoicePage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.orgId) redirect("/login")
  const orgId = session.user.orgId

  const { id } = await params

  const [invoice, clients, org, taxes, items] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id, orgId },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.client.findMany({
      where: { orgId },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.organization.findUnique({ where: { id: orgId }, select: { plan: true, currency: true } }),
    prisma.tax.findMany({ where: { orgId, isActive: true }, select: { id: true, name: true, rate: true }, orderBy: { name: "asc" } }),
    prisma.item.findMany({ where: { orgId, isActive: true }, select: { id: true, name: true, description: true, unitPrice: true, taxRate: true, hsn: true }, orderBy: { name: "asc" } }),
  ])

  if (!invoice) notFound()

  const serialized = serialize(invoice)
  const isPro = org?.plan !== "free"

  const initialData = {
    invoiceId: serialized.id,
    clientId: serialized.clientId,
    issueDate: serialized.issueDate ? format(new Date(serialized.issueDate), "yyyy-MM-dd") : undefined,
    dueDate: serialized.dueDate ? format(new Date(serialized.dueDate), "yyyy-MM-dd") : undefined,
    notes: serialized.notes ?? undefined,
    terms: serialized.terms ?? undefined,
    currency: serialized.currency ?? org?.currency ?? "INR",
    autoFollowUp: serialized.autoFollowUp,
    isRecurring: serialized.isRecurring ?? false,
    recurringFrequency: (serialized.recurringCron === "0 9 * * 1" ? "weekly" : serialized.recurringCron === "0 9 1 1,4,7,10 *" ? "quarterly" : "monthly") as "weekly" | "monthly" | "quarterly",
    items: serialized.items.map((item: { description: string; hsn?: string | null; quantity: unknown; unitPrice: unknown; taxRate: unknown; taxName?: string | null; taxType?: string | null; discount: unknown }) => ({
      description: item.description,
      hsn: item.hsn ?? "",
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      taxRate: Number(item.taxRate),
      taxName: (item.taxName as string) ?? getTaxLabel(serialized.currency ?? org?.currency ?? "INR"),
      taxType: (item.taxType as string) ?? "PERCENTAGE",
      discount: Number(item.discount ?? 0),
    })),
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title={`Edit ${serialized.invoiceNumber}`} />
      <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-2xl mx-auto w-full pb-20 md:pb-6">
        <InvoiceForm
          clients={clients}
          savedItems={items.map((i) => ({ id: i.id, name: i.name, description: i.description, unitPrice: Number(i.unitPrice), taxRate: Number(i.taxRate), hsn: i.hsn }))}
          orgTaxes={taxes.map((t) => ({ id: t.id, name: t.name, rate: Number(t.rate) }))}
          isPro={isPro}
          defaultCurrency={org?.currency ?? "INR"}
          initialData={initialData}
        />
      </div>
    </div>
  )
}
