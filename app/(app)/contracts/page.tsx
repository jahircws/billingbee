import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { Topbar } from "@/components/layout/Topbar"
import { privateMetadata } from "@/lib/metadata"
import { format } from "date-fns"
import { Plus, FileCheck2 } from "lucide-react"

export const metadata = { ...privateMetadata, title: "Contracts" }
export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<{ status?: string; search?: string }>
}

const statusColor: Record<string, string> = {
  DRAFT:    "bg-slate-100 text-slate-600 border border-slate-200",
  SENT:     "bg-blue-50 text-blue-700 border border-blue-200",
  ACCEPTED: "bg-amber-50 text-amber-700 border border-amber-200",
  SIGNED:   "bg-emerald-50 text-emerald-700 border border-emerald-200",
}

export default async function ContractsPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user?.orgId) redirect("/login")
  const orgId = session.user.orgId

  const { status, search } = await searchParams

  const where: Record<string, unknown> = { orgId }
  if (status) where.status = status
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { client: { name: { contains: search, mode: "insensitive" } } },
    ]
  }

  const contracts = await prisma.contract.findMany({
    where,
    include: { client: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const tabs = ["All", "DRAFT", "SENT", "SIGNED"]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Contracts" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 pb-20 md:pb-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-gray-500">
            {contracts.length} contract{contracts.length !== 1 ? "s" : ""}
          </p>
          <Link
            href="/contracts/new"
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New contract
          </Link>
        </div>

        {/* Filter bar */}
        <form method="GET" className="flex gap-2 flex-wrap">
          <input
            name="search"
            defaultValue={search}
            placeholder="Search contracts…"
            className="flex-1 min-w-48 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <select
            name="status"
            defaultValue={status ?? ""}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="">All statuses</option>
            {["DRAFT", "SENT", "ACCEPTED", "SIGNED"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button type="submit" className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg">
            Filter
          </button>
          {(status || search) && (
            <a href="/contracts" className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2">Clear</a>
          )}
        </form>

        {contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileCheck2 className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No contracts yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-5">
              Create a contract, send it to your client, and collect their electronic signature
            </p>
            <Link
              href="/contracts/new"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-150"
            >
              <Plus className="w-4 h-4" />
              Create your first contract
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="py-3 px-4 text-left text-xs text-gray-400 font-medium">Title</th>
                    <th className="py-3 px-4 text-left text-xs text-gray-400 font-medium">Client</th>
                    <th className="py-3 px-4 text-center text-xs text-gray-400 font-medium">Status</th>
                    <th className="py-3 px-4 text-right text-xs text-gray-400 font-medium hidden md:table-cell">Created</th>
                    <th className="py-3 px-4 text-right text-xs text-gray-400 font-medium hidden md:table-cell">Sent</th>
                    <th className="py-3 px-4 text-right text-xs text-gray-400 font-medium hidden lg:table-cell">Signed</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const c = contract as any
                    return (
                    <tr key={contract.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <Link href={`/contracts/${contract.id}`} className="font-medium text-gray-900 hover:text-emerald-600 transition-colors">
                          {contract.title}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{contract.client.name}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[contract.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {contract.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-500 hidden md:table-cell">
                        {format(contract.createdAt, "d MMM yyyy")}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-500 hidden md:table-cell">
                        {c.sentAt ? format(new Date(c.sentAt), "d MMM yyyy") : "—"}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-500 hidden lg:table-cell">
                        {contract.signedAt ? format(contract.signedAt, "d MMM yyyy") : "—"}
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
