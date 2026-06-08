import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { Topbar } from "@/components/layout/Topbar"
import { privateMetadata } from "@/lib/metadata"
import { format } from "date-fns"
import ConvertToContractButton from "./ConvertToContractButton"
import SendProposalButton from "./SendProposalButton"

export const metadata = { ...privateMetadata, title: "Proposal" }
export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
}

const statusColor: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SENT: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
}

const statusLabel: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent — awaiting client response",
  ACCEPTED: "Accepted by client",
  REJECTED: "Declined by client",
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

  const sections = proposal.sections as unknown as Section[]
  const pricing = proposal.pricing as { description?: string; total?: number; currency?: string } | null

  const formatAmount = (total: number, currency?: string) => {
    const sym = !currency || currency === "INR" ? "₹"
      : currency === "USD" ? "$"
      : currency === "EUR" ? "€"
      : currency === "GBP" ? "£"
      : currency + " "
    const locale = (!currency || currency === "INR") ? "en-IN" : "en-US"
    return `${sym}${total.toLocaleString(locale)}`
  }

  const canSend = proposal.status === "DRAFT"
  const canConvert = proposal.status === "ACCEPTED" && !proposal.contract

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title={proposal.title} />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 pb-20 md:pb-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{proposal.title}</h2>
            <p className="text-sm text-gray-500">{proposal.client.name}</p>
            {proposal.timeline && (
              <p className="text-xs text-gray-400 mt-0.5">Timeline: {proposal.timeline}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[proposal.status] ?? "bg-gray-100 text-gray-600"}`}>
              {statusLabel[proposal.status] ?? proposal.status}
            </span>
            {canSend && (
              <SendProposalButton proposalId={proposal.id} clientEmail={proposal.client.email ?? null} />
            )}
            {canConvert && (
              <ConvertToContractButton proposalId={proposal.id} />
            )}
            {proposal.contract && (
              <a href={`/contracts/${proposal.contract.id}`}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors">
                View contract →
              </a>
            )}
          </div>
        </div>

        {/* Status banners */}
        {proposal.status === "SENT" && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
            Proposal sent to <strong>{proposal.client.name}</strong> — waiting for their response.
          </div>
        )}
        {proposal.status === "ACCEPTED" && !proposal.contract && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800">
            🎉 <strong>{proposal.client.name}</strong> accepted this proposal. Click <strong>Convert to contract</strong> to proceed.
          </div>
        )}
        {proposal.status === "REJECTED" && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
            <strong>{proposal.client.name}</strong> declined this proposal.
          </div>
        )}

        {/* Sections */}
        {sections.map((section, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">{section.title}</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{section.content}</p>
          </div>
        ))}

        {/* Pricing */}
        {pricing && (
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Investment</h3>
            {pricing.description && (
              <p className="text-sm text-gray-600 mb-3">{pricing.description}</p>
            )}
            {pricing.total !== undefined && pricing.total > 0 && (
              <p className="text-2xl font-black text-emerald-700">
                {formatAmount(Number(pricing.total), pricing.currency)}
              </p>
            )}
          </div>
        )}

        <p className="text-xs text-gray-400">Created {format(proposal.createdAt, "d MMMM yyyy")}</p>
      </div>
    </div>
  )
}
