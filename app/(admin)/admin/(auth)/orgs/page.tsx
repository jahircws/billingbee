import { requireAdminSession } from "@/lib/admin-auth"
import prisma from "@/lib/db"
import Link from "next/link"
import { Search } from "lucide-react"

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: Promise<{ plan?: string; q?: string }>
}

export default async function AdminOrgsPage({ searchParams }: PageProps) {
  await requireAdminSession()
  const { plan, q } = await searchParams

  const where: Record<string, unknown> = {}
  if (plan && plan !== "all") where.plan = plan
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ]
  }

  const orgs = await prisma.organization.findMany({
    where,
    include: {
      _count: { select: { invoices: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Organizations</h1>
          <p className="text-gray-400 text-sm mt-1">{orgs.length} results</p>
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
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    org.plan === "pro"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-gray-700 text-gray-400"
                  }`}>
                    {org.plan}
                  </span>
                  {org.planExpiry && (
                    <p className="text-gray-500 text-xs mt-0.5">
                      exp {new Date(org.planExpiry).toLocaleDateString()}
                    </p>
                  )}
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
    </div>
  )
}
