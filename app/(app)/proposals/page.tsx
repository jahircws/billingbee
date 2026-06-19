import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { Topbar } from "@/components/layout/Topbar"
import { privateMetadata } from "@/lib/metadata"
import { format } from "date-fns"
import { Plus, FileText } from "lucide-react"
import NewProposalButton from "./NewProposalButton"
import ProposalRowActions from "./ProposalRowActions"

export const metadata = { ...privateMetadata, title: "Proposals" }
export const dynamic = "force-dynamic"

const statusColor: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SENT: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
}

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function ProposalsPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user?.orgId) redirect("/login")
  const orgId = session.user.orgId

  const { status } = await searchParams

  const [proposals, clients] = await Promise.all([
    prisma.proposal.findMany({
      where: { orgId, ...(status ? { status: status as never } : {}) },
      include: { client: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.findMany({
      where: { orgId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Proposals" />
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 pb-20 md:pb-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-gray-500">{proposals.length} proposal{proposals.length !== 1 ? "s" : ""}</p>
          <NewProposalButton clients={clients} />
        </div>

        {/* Status filter */}
        <form method="GET" className="flex gap-2 flex-wrap">
          <select
            name="status"
            defaultValue={status ?? ""}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="">All statuses</option>
            {["DRAFT", "SENT", "ACCEPTED", "REJECTED"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button type="submit" className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg">
            Filter
          </button>
          {status && (
            <a href="/proposals" className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2">Clear</a>
          )}
        </form>

        {proposals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No proposals yet</p>
            <p className="text-xs text-gray-400 mt-1">Generate AI-powered proposals for your clients</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="py-3 px-4 text-left text-xs text-gray-400 font-medium">Title</th>
                  <th className="py-3 px-4 text-left text-xs text-gray-400 font-medium hidden md:table-cell">Client</th>
                  <th className="py-3 px-4 text-center text-xs text-gray-400 font-medium">Status</th>
                  <th className="py-3 px-4 text-right text-xs text-gray-400 font-medium hidden md:table-cell">Created</th>
                  <th className="py-3 px-4 w-10" />
                </tr>
              </thead>
              <tbody>
                {proposals.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <Link href={`/proposals/${p.id}`} className="font-medium text-gray-800 hover:text-emerald-700">
                        {p.title}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-gray-500 hidden md:table-cell">{(p as { client?: { name: string } }).client?.name}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[p.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-400 hidden md:table-cell">
                      {format(p.createdAt, "d MMM yyyy")}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <ProposalRowActions proposalId={p.id} title={p.title} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
