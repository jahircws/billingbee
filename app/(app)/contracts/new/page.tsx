import { redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { Topbar } from "@/components/layout/Topbar"
import { privateMetadata } from "@/lib/metadata"
import NewContractForm from "./NewContractForm"

export const metadata = { ...privateMetadata, title: "New Contract" }
export const dynamic = "force-dynamic"

export default async function NewContractPage() {
  const session = await auth()
  if (!session?.user?.orgId) redirect("/login")
  const orgId = session.user.orgId

  const [clients, org] = await Promise.all([
    prisma.client.findMany({
      where: { orgId, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true },
    }),
  ])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="New Contract" />
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
        <div className="max-w-2xl">
          <NewContractForm clients={clients} orgName={org?.name ?? "Your Business"} />
        </div>
      </div>
    </div>
  )
}
