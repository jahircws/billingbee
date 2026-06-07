interface Proposal { id: string; title: string; status: string; createdAt: Date }
interface Contract { id: string; title: string; status: string; signedAt: Date | null }
interface Invoice { id: string; status: string }

interface Props {
  proposal: Proposal | null
  contract: Contract | null
  invoices: Invoice[]
}

const STEPS = ["Proposal", "Accepted", "Contract", "Signed", "Invoice", "Paid"] as const

function resolveActive(proposal: Proposal | null, contract: Contract | null, invoices: Invoice[]): number {
  if (invoices.some((i) => i.status === "PAID")) return 5
  if (invoices.length > 0) return 4
  if (contract?.status === "SIGNED") return 3
  if (contract) return 2
  if (proposal?.status === "ACCEPTED") return 1
  if (proposal) return 0
  return -1
}

export default function PipelineTimeline({ proposal, contract, invoices }: Props) {
  if (!proposal && !contract && invoices.length === 0) return null

  const active = resolveActive(proposal, contract, invoices)

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Pipeline</p>
      <div className="flex items-center gap-0">
        {STEPS.map((step, i) => {
          const done = i <= active
          const current = i === active
          return (
            <div key={step} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  done ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400"
                } ${current ? "ring-2 ring-emerald-300" : ""}`}>
                  {done ? "✓" : i + 1}
                </div>
                <span className={`text-[10px] mt-1 whitespace-nowrap ${done ? "text-emerald-600 font-medium" : "text-gray-400"}`}>
                  {step}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 mb-4 ${i < active ? "bg-emerald-400" : "bg-gray-100"}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
