"use client"

import { useRouter } from "next/navigation"
import { FileText } from "lucide-react"

interface Proposal {
  id: string
  title: string
  pricing: unknown
}

interface Props {
  contractId: string
  clientId: string
  proposal: Proposal | null
}

export default function CreateInvoiceFromContractButton({ contractId, clientId, proposal }: Props) {
  const router = useRouter()

  function handle() {
    // Pre-fill new invoice with client; pricing from proposal if available
    const params = new URLSearchParams({ clientId })
    router.push(`/invoices/new?${params.toString()}`)
  }

  return (
    <button
      onClick={handle}
      className="flex items-center gap-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
    >
      <FileText className="w-4 h-4" />
      Create invoice
    </button>
  )
}
