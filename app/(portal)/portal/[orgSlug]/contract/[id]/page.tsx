import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import Link from "next/link"
import { format } from "date-fns"
import SignContractButton from "./SignContractButton"

interface Props {
  params: Promise<{ orgSlug: string; id: string }>
}

export const dynamic = "force-dynamic"

export default async function PortalContractPage({ params }: Props) {
  const { orgSlug, id } = await params
  const session = await auth()

  if (!session?.user?.clientId || session.user.userType !== "CLIENT") {
    redirect(`/portal/${orgSlug}/login`)
  }

  const contract = await prisma.contract.findUnique({
    where: { id, clientId: session.user.clientId },
  })

  if (!contract) notFound()

  return (
    <div className="max-w-2xl mx-auto w-full p-4 md:p-8 space-y-6">
      <div>
        <Link href={`/portal/${orgSlug}/dashboard`} className="text-xs text-gray-400 hover:text-gray-600 mb-2 block">
          ← Back to portal
        </Link>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-xl font-bold text-gray-900">{contract.title}</h1>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            contract.status === "SIGNED" ? "bg-purple-100 text-purple-700" :
            contract.status === "ACCEPTED" ? "bg-emerald-100 text-emerald-700" :
            "bg-gray-100 text-gray-600"
          }`}>
            {contract.status}
          </span>
        </div>
        {contract.signedAt && (
          <p className="text-xs text-gray-400 mt-1">
            Signed {format(contract.signedAt, "d MMM yyyy")} by {contract.signedBy}
          </p>
        )}
      </div>

      {/* Contract content */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap font-mono text-xs leading-relaxed">
          {contract.content}
        </div>
      </div>

      {/* E-sign */}
      {contract.status !== "SIGNED" && (
        <SignContractButton contractId={contract.id} orgSlug={orgSlug} />
      )}

      {contract.status === "SIGNED" && (
        <div className="bg-purple-50 border border-purple-200 text-purple-800 text-sm px-4 py-3 rounded-lg font-medium">
          This contract was signed on {contract.signedAt ? format(contract.signedAt, "d MMMM yyyy") : "—"}.
        </div>
      )}
    </div>
  )
}
