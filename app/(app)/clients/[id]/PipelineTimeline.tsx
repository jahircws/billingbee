interface Proposal { id: string; title: string; status: string; createdAt: Date }
interface Contract { id: string; title: string; status: string; signedAt: Date | null }
interface Invoice { id: string; status: string }

interface Props {
  proposal: Proposal | null
  contract: Contract | null
  invoices: Invoice[]
}

const STEP_LABELS = ["Proposal", "Accepted", "Contract", "Signed", "Invoice", "Paid"] as const

// Each stage is independent: a ✓ means that artifact actually exists, rather
// than assuming every earlier stage was completed.
function resolveSteps(proposal: Proposal | null, contract: Contract | null, invoices: Invoice[]): boolean[] {
  return [
    proposal != null,                                   // Proposal
    proposal?.status === "ACCEPTED",                    // Accepted
    contract != null,                                   // Contract
    contract?.status === "SIGNED",                      // Signed
    invoices.length > 0,                                // Invoice
    invoices.some((i) => i.status === "PAID"),          // Paid
  ]
}

export default function PipelineTimeline({ proposal, contract, invoices }: Props) {
  if (!proposal && !contract && invoices.length === 0) return null

  const steps = resolveSteps(proposal, contract, invoices)
  // The "current" stage is the latest completed one.
  const lastDone = steps.lastIndexOf(true)

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Pipeline</p>
      <div className="flex items-center gap-0">
        {STEP_LABELS.map((step, i) => {
          const done = steps[i]
          const current = i === lastDone
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
              {i < STEP_LABELS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 mb-4 ${done && steps[i + 1] ? "bg-emerald-400" : "bg-gray-100"}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
