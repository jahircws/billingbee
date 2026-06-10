import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { Topbar } from "@/components/layout/Topbar"
import { privateMetadata } from "@/lib/metadata"
import ProposalEditor from "./ProposalEditor"

export const metadata = { ...privateMetadata, title: "Proposal" }
export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
}

interface Section { title: string; content: string }

export default async function ProposalPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.orgId) redirect("/login")
  const orgId = session.user.orgId

  const { id } = await params

  const proposal = await prisma.proposal.findUnique({
    where: { id, orgId },
    include: { client: true, contract: true },
  })

  if (!proposal) notFound()

  const serialized = {
    id: proposal.id,
    title: proposal.title,
    status: proposal.status,
    sections: proposal.sections as unknown as Section[],
    pricing: proposal.pricing as { description?: string; total?: number; currency?: string } | null,
    timeline: proposal.timeline,
    createdAt: proposal.createdAt,
    client: { name: proposal.client.name, email: proposal.client.email },
    contract: proposal.contract ? { id: proposal.contract.id } : null,
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title={proposal.title} />
      <ProposalEditor proposal={serialized} />
    </div>
  )
}
