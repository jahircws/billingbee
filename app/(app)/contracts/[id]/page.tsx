import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { Topbar } from "@/components/layout/Topbar"
import { privateMetadata } from "@/lib/metadata"
import { format } from "date-fns"
import CreateInvoiceFromContractButton from "./CreateInvoiceFromContractButton"

export const metadata = { ...privateMetadata, title: "Contract" }
export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
}

const statusColor: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SENT: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  SIGNED: "bg-purple-100 text-purple-700",
}

export default async function ContractPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.orgId) redirect("/login")
  const orgId = session.user.orgId

  const { id } = await params

  const contract = await prisma.contract.findUnique({
    where: { id, orgId },
    include: {
      client: true,
      proposal: { select: { id: true, title: true, pricing: true } },
    },
  })

  if (!contract) notFound()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title={contract.title} />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 pb-20 md:pb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{contract.title}</h2>
            <p className="text-sm text-gray-500">{contract.client.name}</p>
            {contract.signedAt && (
              <p className="text-xs text-gray-400 mt-0.5">
                Signed {format(contract.signedAt, "d MMMM yyyy")} by {contract.signedBy}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[contract.status] ?? "bg-gray-100 text-gray-600"}`}>
              {contract.status}
            </span>
            {contract.status === "SIGNED" && (
              <CreateInvoiceFromContractButton
                contractId={contract.id}
                clientId={contract.clientId}
                proposal={contract.proposal}
              />
            )}
          </div>
        </div>

        {contract.proposal && (
          <div className="text-sm text-gray-500">
            From proposal:{" "}
            <Link href={`/proposals/${contract.proposal.id}`} className="text-emerald-600 hover:underline">
              {contract.proposal.title}
            </Link>
          </div>
        )}

        {/* Contract content */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="text-sm text-gray-700 whitespace-pre-wrap font-mono text-xs leading-relaxed max-h-[60vh] overflow-y-auto">
            {contract.content}
          </div>
        </div>

        <p className="text-xs text-gray-400">Created {format(contract.createdAt, "d MMMM yyyy")}</p>
      </div>
    </div>
  )
}
