import Image from "next/image"
import { notFound } from "next/navigation"
import { getContractByToken } from "@/app/actions/contract"
import ContractSignForm from "./ContractSignForm"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ token: string }>
}

export default async function TokenContractPage({ params }: Props) {
  const { token } = await params
  const contract = await getContractByToken(token)

  if (!contract) notFound()

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Image src="/logo.png" alt="BillingBee" width={100} height={26} className="object-contain brightness-0" />
          <span className="text-xs text-gray-400">Secure document signing</span>
        </div>

        {/* Contract card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <p className="text-xs text-gray-400 mb-1">{contract.orgName}</p>
            <h1 className="text-lg font-bold text-gray-900">{contract.title}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Sent to {contract.clientName}</p>
          </div>

          {/* Contract content */}
          <div className="px-6 py-5">
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed text-sm font-mono">
              {contract.content}
            </div>
          </div>
        </div>

        {/* Sign form / signed banner */}
        <ContractSignForm
          token={token}
          status={contract.status}
          signedBy={contract.signedBy}
          signedAt={contract.signedAt}
        />

        <p className="text-xs text-center text-gray-400 pb-4">
          This document was sent via BillingBee. Questions? Contact {contract.orgName} directly.
        </p>
      </div>
    </div>
  )
}
