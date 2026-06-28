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
      <Topbar title="New Proposal" showBack backHref="/proposals" />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <NewProposalForm clients={clients} />
        </div>
      </div>
    </div>
  )
}
