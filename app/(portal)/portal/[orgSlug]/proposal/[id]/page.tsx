import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import Link from "next/link"
import { format } from "date-fns"
import ProposalActions from "./ProposalActions"

interface Props {
  params: Promise<{ orgSlug: string; id: string }>
}

export const dynamic = "force-dynamic"

interface Section { title: string; content: string }

export default async function PortalProposalPage({ params }: Props) {
  const { orgSlug, id } = await params
  const session = await auth()

  if (!session?.user?.clientId || session.user.userType !== "CLIENT") {
    redirect(`/portal/${orgSlug}/login`)
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id, clientId: session.user.clientId },
    include: { client: { include: { org: { select: { name: true } } } } },
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

  return (
    <div className="max-w-2xl mx-auto w-full p-4 md:p-8 space-y-6">
      <div>
        <Link href={`/portal/${orgSlug}/dashboard`} className="text-xs text-gray-400 hover:text-gray-600 mb-2 block">
          ← Back to portal
        </Link>
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">
          Proposal from {proposal.client.org.name}
        </p>
        <h1 className="text-2xl font-bold text-gray-900">{proposal.title}</h1>
        {proposal.timeline && (
          <p className="text-sm text-gray-500 mt-1">Timeline: {proposal.timeline}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          Sent {format(proposal.createdAt, "d MMMM yyyy")}
        </p>
      </div>

      {/* Sections */}
      {sections.map((section, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-2">{section.title}</h2>
          <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{section.content}</p>
        </div>
      ))}

      {/* Pricing */}
      {pricing && pricing.total !== undefined && pricing.total > 0 && (
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-2">Investment</h2>
          {pricing.description && (
            <p className="text-sm text-gray-600 mb-3">{pricing.description}</p>
          )}
          <p className="text-2xl font-black text-emerald-700">
            {formatAmount(Number(pricing.total), pricing.currency)}
          </p>
        </div>
      )}

      {/* Actions */}
      {proposal.status === "SENT" && (
        <ProposalActions proposalId={proposal.id} orgSlug={orgSlug} />
      )}
      {proposal.status === "ACCEPTED" && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 rounded-xl font-medium">
          ✓ You accepted this proposal.
        </div>
      )}
      {proposal.status === "REJECTED" && (
        <div className="bg-gray-50 border border-gray-200 text-gray-600 text-sm px-4 py-3 rounded-xl font-medium">
          You declined this proposal.
        </div>
      )}
    </div>
  )
}
