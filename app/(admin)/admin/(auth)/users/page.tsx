import { requireAdminSession } from "@/lib/admin-auth"
import prisma from "@/lib/db"
import Link from "next/link"
import { Search, ChevronUp, ChevronDown } from "lucide-react"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 50

type SortField = "name" | "lastLogin" | "createdAt" | "invoices"
type SortDir = "asc" | "desc"

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string; sort?: string; dir?: string }>
}

function SortHeader({
  label,
  field,
  current,
  dir,
  q,
}: {
  label: string
  field: SortField
  current: SortField
  dir: SortDir
  q?: string
}) {
  const isActive = current === field
  const nextDir = isActive && dir === "desc" ? "asc" : "desc"
  const params = new URLSearchParams()
  if (q) params.set("q", q)
  params.set("sort", field)
  params.set("dir", nextDir)
  params.set("page", "1")

  return (
    <Link href={`?${params.toString()}`} className="flex items-center gap-1 hover:text-gray-200 transition-colors">
      {label}
      {isActive ? (
        dir === "desc" ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />
      ) : (
        <ChevronDown className="h-3 w-3 opacity-30" />
      )}
    </Link>
  )
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  await requireAdminSession()
  const { q, page: pageParam, sort, dir } = await searchParams

  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1)
  const sortField = (sort as SortField) ?? "createdAt"
  const sortDir = (dir as SortDir) ?? "desc"

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {}

  let orderBy: Record<string, unknown>
  if (sortField === "lastLogin") {
    orderBy = { lastLoginAt: { sort: sortDir, nulls: "last" as const } }
  } else if (sortField === "name") {
    orderBy = { name: sortDir }
  } else if (sortField === "invoices") {
    // Derived — sort post-query
    orderBy = { createdAt: "desc" }
  } else {
    orderBy = { createdAt: sortDir }
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        orgUsers: {
          include: {
            org: {
              include: { _count: { select: { invoices: true } } },
            },
          },
        },
      },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ])

  const enriched = users.map((u) => ({
    ...u,
    totalInvoices: u.orgUsers.reduce((sum, ou) => sum + ou.org._count.invoices, 0),
  }))

  if (sortField === "invoices") {
    enriched.sort((a, b) =>
      sortDir === "desc" ? b.totalInvoices - a.totalInvoices : a.totalInvoices - b.totalInvoices
    )
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (sort) params.set("sort", sort)
    if (dir) params.set("dir", dir)
    params.set("page", String(p))
    return `?${params.toString()}`
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-gray-400 text-sm mt-1">{total.toLocaleString()} users</p>
      </div>

      <form method="GET" className="flex gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name or email…"
            className="bg-gray-900 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-72"
          />
        </div>
        {sort && <input type="hidden" name="sort" value={sort} />}
        {dir && <input type="hidden" name="dir" value={dir} />}
        <button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          Search
        </button>
      </form>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-xs text-gray-400">
              <th className="text-left px-5 py-3 font-medium">
                <SortHeader label="User" field="name" current={sortField} dir={sortDir} q={q} />
              </th>
              <th className="text-left px-5 py-3 font-medium">Organizations</th>
              <th className="text-right px-5 py-3 font-medium">
                <SortHeader label="Invoices" field="invoices" current={sortField} dir={sortDir} q={q} />
              </th>
              <th className="text-left px-5 py-3 font-medium">
                <SortHeader label="Last Login" field="lastLogin" current={sortField} dir={sortDir} q={q} />
              </th>
              <th className="text-left px-5 py-3 font-medium">
                <SortHeader label="Joined" field="createdAt" current={sortField} dir={sortDir} q={q} />
              </th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {enriched.map((user) => (
              <tr key={user.id} className="border-b border-gray-800/60 hover:bg-gray-800/30 transition-colors">
                <td className="px-5 py-3">
                  <p className="font-medium text-white">{user.name ?? "—"}</p>
                  <p className="text-gray-500 text-xs">{user.email}</p>
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-col gap-0.5">
                    {user.orgUsers.length === 0 && <span className="text-gray-600 text-xs">—</span>}
                    {user.orgUsers.map((ou) => (
                      <div key={ou.id} className="flex items-center gap-1.5">
                        <Link
                          href={`/admin/orgs/${ou.orgId}`}
                          className="text-xs text-emerald-400 hover:text-emerald-300 truncate max-w-[140px]"
                        >
                          {ou.org.name}
                        </Link>
                        <span className="text-gray-600 text-xs capitalize">{ou.role.toLowerCase()}</span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-3 text-right text-gray-300">{user.totalInvoices}</td>
                <td className="px-5 py-3 text-gray-400 text-xs">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : <span className="text-gray-600">Never</span>}
                </td>
                <td className="px-5 py-3 text-gray-400 text-xs">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-3 text-right">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="text-emerald-400 hover:text-emerald-300 text-xs font-medium"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {enriched.length === 0 && (
          <p className="text-center text-gray-500 py-12">No users found</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-gray-500 text-sm">
            Page {page} of {totalPages} &mdash; showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString()}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={pageUrl(page - 1)} className="bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm rounded-lg px-4 py-2">
                ← Prev
              </Link>
            )}
            {page < totalPages && (
              <Link href={pageUrl(page + 1)} className="bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm rounded-lg px-4 py-2">
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
