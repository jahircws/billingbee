import { requireAdminSession } from "@/lib/admin-auth"
import prisma from "@/lib/db"
import Link from "next/link"
import { Search } from "lucide-react"
import InlinePlanSelect from "./InlinePlanSelect"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 50

interface PageProps {
  searchParams: Promise<{ plan?: string; q?: string; page?: string }>
}

export default async function AdminOrgsPage({ searchParams }: PageProps) {
  const adminSession = await requireAdminSession()
  const { plan, q, page: pageParam } = await searchParams

  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1)

  const where: Record<string, unknown> = {}
  if (plan && plan !== "all") where.plan = plan
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ]
  }

  const [orgs, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      include: {
        _count: { select: { invoices: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.organization.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (plan && plan !== "all") params.set("plan", plan)
    params.set("page", String(p))
    return `?${params.toString()}`
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Organizations</h1>
          <p className="text-gray-400 text-sm mt-1">{total.toLocaleString()} organizations</p>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" className="flex gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, email, slug…"
            className="bg-gray-900 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-72"
          />
        </div>
        <select
          name="plan"
          defaultValue={plan ?? "all"}
          className="bg-gray-900 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          <option value="all">All plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
        </select>
        <button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          Filter
        </button>
      </form>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-xs text-gray-400">
              <th className="text-left px-5 py-3 font-medium">Organization</th>
              <th className="text-left px-5 py-3 font-medium">Plan</th>
              <th className="text-right px-5 py-3 font-medium">Invoices</th>
              <th className="text-left px-5 py-3 font-medium">Source</th>
              <th className="text-left px-5 py-3 font-medium">Created</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {orgs.map((org) => (
              <tr key={org.id} className="border-b border-gray-800/60 hover:bg-gray-800/30 transition-colors">
                <td className="px-5 py-3">
                  <p className="font-medium text-white">{org.name}</p>
                  <p className="text-gray-500 text-xs">{org.email ?? org.slug}</p>
                </td>
                <td className="px-5 py-3">
                  <InlinePlanSelect
                    orgId={org.id}
                    currentPlan={org.plan}
                    planExpiry={org.planExpiry?.toISOString() ?? null}
                    adminId={adminSession.adminId}
                  />
                </td>
                <td className="px-5 py-3 text-right text-gray-300">{org._count.invoices}</td>
                <td className="px-5 py-3 text-gray-400 text-xs">{org.acquisitionSource ?? "—"}</td>
                <td className="px-5 py-3 text-gray-400 text-xs">{new Date(org.createdAt).toLocaleDateString()}</td>
                <td className="px-5 py-3 text-right">
                  <Link
                    href={`/admin/orgs/${org.id}`}
                    className="text-emerald-400 hover:text-emerald-300 text-xs font-medium"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orgs.length === 0 && (
          <p className="text-center text-gray-500 py-12">No organizations found</p>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-gray-500 text-sm">
            Page {page} of {totalPages} &mdash; showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString()}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={pageUrl(page - 1)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm rounded-lg px-4 py-2"
              >
                ← Prev
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={pageUrl(page + 1)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm rounded-lg px-4 py-2"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
