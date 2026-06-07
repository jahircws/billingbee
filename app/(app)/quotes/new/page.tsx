import { redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { Topbar } from "@/components/layout/Topbar"
import InvoiceForm from "@/components/invoices/InvoiceForm"
import { privateMetadata } from "@/lib/metadata"

export const metadata = { ...privateMetadata, title: "New Quote" }
export const dynamic = "force-dynamic"

export default async function NewQuotePage() {
  const session = await auth()
  if (!session?.user?.orgId) redirect("/login")
  const orgId = session.user.orgId

  const clients = await prisma.client.findMany({
    where: { orgId },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="New Quote" />
      <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-2xl mx-auto w-full pb-20 md:pb-6">
        <InvoiceForm type="quote" clients={clients} />
      </div>
    </div>
  )
}
