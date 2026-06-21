import { redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { Topbar } from "@/components/layout/Topbar"
import { privateMetadata } from "@/lib/metadata"
import NewProposalForm from "./NewProposalForm"

export const metadata = { ...privateMetadata, title: "New Proposal" }
export const dynamic = "force-dynamic"

export default async function NewProposalPage() {
  const session = await auth()
  if (!session?.user?.orgId) redirect("/login")
  const orgId = session.user.orgId

  const clients = await prisma.client.findMany({
    where: { orgId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="New Proposal" />
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
        <div className="max-w-2xl">
          <NewProposalForm clients={clients} />
        </div>
      </div>
    </div>
  )
}
