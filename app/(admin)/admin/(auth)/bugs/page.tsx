import { requireAdminSession } from "@/lib/admin-auth"
import prisma from "@/lib/db"
import { format } from "date-fns"
import BugStatusActions from "./BugStatusActions"

export const dynamic = "force-dynamic"

const TYPE_STYLE: Record<string, string> = {
  ERROR_500: "bg-red-100 text-red-700",
  ERROR_404: "bg-orange-100 text-orange-700",
  MANUAL: "bg-blue-100 text-blue-700",
}

const STATUS_STYLE: Record<string, string> = {
  OPEN: "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
}

const TYPE_LABEL: Record<string, string> = {
  ERROR_500: "500 Error",
  ERROR_404: "404 Error",
  MANUAL: "Bug Report",
}

interface Props {
  searchParams: Promise<{ type?: string; status?: string }>
}

export default async function AdminBugsPage({ searchParams }: Props) {
  await requireAdminSession()

  const { type, status } = await searchParams

  const where: Record<string, unknown> = {}
  if (type) where.type = type
  if (status) where.status = status

  const [reports, counts] = await Promise.all([
    prisma.issueReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.issueReport.groupBy({
      by: ["type", "status"],
      _count: true,
    }),
  ])

  const total = reports.length
  const open = reports.filter(r => r.status === "OPEN").length
  const errors500 = reports.filter(r => r.type === "ERROR_500").length
  void counts

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Bug & Error Reports</h1>
        <div className="flex gap-2 text-xs">
          <span className="bg-red-100 text-red-700 font-semibold px-2.5 py-1 rounded-full">{errors500} 500s</span>
          <span className="bg-amber-100 text-amber-700 font-semibold px-2.5 py-1 rounded-full">{open} open</span>
          <span className="bg-gray-100 text-gray-600 font-semibold px-2.5 py-1 rounded-full">{total} total</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap text-sm">
        {[
          { label: "All", href: "/admin/bugs" },
          { label: "500 Errors", href: "/admin/bugs?type=ERROR_500" },
          { label: "404 Errors", href: "/admin/bugs?type=ERROR_404" },
          { label: "Bug Reports", href: "/admin/bugs?type=MANUAL" },
          { label: "Open only", href: "/admin/bugs?status=OPEN" },
          { label: "Resolved", href: "/admin/bugs?status=RESOLVED" },
        ].map(f => (
          <a
            key={f.href}
            href={f.href}
            className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium transition-colors"
          >
            {f.label}
          </a>
        ))}
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">No reports found</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="py-3 px-4 text-left text-xs text-gray-400 font-medium">Type</th>
                <th className="py-3 px-4 text-left text-xs text-gray-400 font-medium">Title / URL</th>
                <th className="py-3 px-4 text-left text-xs text-gray-400 font-medium">User</th>
                <th className="py-3 px-4 text-left text-xs text-gray-400 font-medium">Org</th>
                <th className="py-3 px-4 text-left text-xs text-gray-400 font-medium">Status</th>
                <th className="py-3 px-4 text-left text-xs text-gray-400 font-medium">When</th>
                <th className="py-3 px-4 text-left text-xs text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => {
                const meta = r.metadata as Record<string, unknown> | null
                return (
                  <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 align-top">
                    <td className="py-3 px-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${TYPE_STYLE[r.type] ?? "bg-gray-100 text-gray-600"}`}>
                        {TYPE_LABEL[r.type] ?? r.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-medium text-gray-900 text-xs leading-snug">{r.title}</p>
                      <p className="text-gray-400 text-xs mt-0.5 font-mono truncate">{r.url}</p>
                      {r.description && (
                        <p className="text-gray-500 text-xs mt-1 line-clamp-2">{r.description}</p>
                      )}
                      {meta?.severity != null && (
                        <span className="text-xs text-gray-400 mt-1 inline-block">Severity: {String(meta.severity)}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {r.userName ? (
                        <div>
                          <p className="text-xs font-medium text-gray-800">{r.userName}</p>
                          <p className="text-xs text-gray-400">{r.userEmail}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-gray-700">{r.orgName ?? "—"}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-400 whitespace-nowrap">
                      {format(r.createdAt, "d MMM, HH:mm")}
                    </td>
                    <td className="py-3 px-4">
                      <BugStatusActions id={r.id} status={r.status} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
