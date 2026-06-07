import { requireAdminSession } from "@/lib/admin-auth"
import prisma from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import OrgActions from "./OrgActions"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function AdminOrgDetailPage({ params, searchParams }: PageProps) {
  const adminSession = await requireAdminSession()
  const { id } = await params
  const { tab = "overview" } = await searchParams

  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      _count: { select: { invoices: true, clients: true } },
      orgUsers: { include: { user: { select: { email: true, name: true } } } },
    },
  })
  if (!org) notFound()

  const [invoices, payments, aiLogs] = await Promise.all([
    tab === "invoices"
      ? prisma.invoice.findMany({
          where: { orgId: id },
          include: { client: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 50,
        })
      : Promise.resolve([]),
    tab === "payments"
      ? prisma.payment.findMany({
          where: { orgId: id },
          orderBy: { createdAt: "desc" },
          take: 50,
        })
      : Promise.resolve([]),
    tab === "ai"
      ? prisma.aIUsageLog.findMany({
          where: { orgId: id },
          orderBy: { createdAt: "desc" },
          take: 100,
        })
      : Promise.resolve([]),
  ])

  const TABS = ["overview", "invoices", "payments", "ai"]

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <Link href="/admin/orgs" className="text-gray-500 text-sm hover:text-gray-300">
          ← Organizations
        </Link>
        <h1 className="text-2xl font-bold text-white mt-2">{org.name}</h1>
        <p className="text-gray-400 text-sm">{org.slug} · {org.plan} plan</p>
      </div>

      {/* Actions */}
      <OrgActions org={{ id: org.id, plan: org.plan, planExpiry: org.planExpiry?.toISOString() ?? null }} adminId={adminSession.adminId} />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-800">
        {TABS.map((t) => (
          <Link
            key={t}
            href={`/admin/orgs/${id}?tab=${t}`}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "text-emerald-400 border-b-2 border-emerald-400"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {t === "ai" ? "AI Usage" : t}
          </Link>
        ))}
      </div>

      {/* Overview tab */}
      {tab === "overview" && (
        <div className="grid grid-cols-2 gap-4">
          {[
            ["Email", org.email ?? "—"],
            ["Phone", org.phone ?? "—"],
            ["Country", org.country],
            ["Currency", org.currency],
            ["Plan", org.plan],
            ["Plan Expiry", org.planExpiry ? new Date(org.planExpiry).toLocaleDateString() : "—"],
            ["Total Invoices", org._count.invoices.toString()],
            ["Total Clients", org._count.clients.toString()],
            ["Acquisition Source", org.acquisitionSource ?? "—"],
            ["Created", new Date(org.createdAt).toLocaleString()],
          ].map(([label, value]) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className="text-sm font-medium text-white">{value}</p>
            </div>
          ))}

          <div className="col-span-2 bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-3">Users</p>
            {org.orgUsers.map((ou) => (
              <div key={ou.id} className="flex items-center justify-between py-1.5 border-b border-gray-800 last:border-0">
                <div>
                  <p className="text-sm text-white">{ou.user.name ?? ou.user.email}</p>
                  <p className="text-xs text-gray-500">{ou.user.email}</p>
                </div>
                <span className="text-xs text-gray-400 capitalize">{ou.role.toLowerCase()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoices tab */}
      {tab === "invoices" && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-400">
                <th className="text-left px-5 py-3">Invoice #</th>
                <th className="text-left px-5 py-3">Client</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-right px-5 py-3">Total</th>
                <th className="text-left px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-800/60">
                  <td className="px-5 py-3 text-white font-mono text-xs">{inv.invoiceNumber}</td>
                  <td className="px-5 py-3 text-gray-300">{(inv as unknown as { client: { name: string } }).client?.name ?? "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      inv.status === "PAID" ? "bg-emerald-500/20 text-emerald-400"
                      : inv.status === "OVERDUE" ? "bg-red-500/20 text-red-400"
                      : "bg-gray-700 text-gray-400"
                    }`}>{inv.status}</span>
                  </td>
                  <td className="px-5 py-3 text-right text-gray-300">
                    {Number(inv.total).toLocaleString()} {inv.currency}
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{new Date(inv.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {invoices.length === 0 && <p className="text-center text-gray-500 py-8">No invoices</p>}
        </div>
      )}

      {/* Payments tab */}
      {tab === "payments" && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-400">
                <th className="text-left px-5 py-3">Method</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-right px-5 py-3">Amount</th>
                <th className="text-left px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-gray-800/60">
                  <td className="px-5 py-3 text-gray-300">{p.method}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      p.status === "succeeded" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                    }`}>{p.status}</span>
                  </td>
                  <td className="px-5 py-3 text-right text-gray-300">{Number(p.amount).toLocaleString()} {p.currency}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {payments.length === 0 && <p className="text-center text-gray-500 py-8">No payments</p>}
        </div>
      )}

      {/* AI Usage tab */}
      {tab === "ai" && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-400">
                <th className="text-left px-5 py-3">Type</th>
                <th className="text-left px-5 py-3">Model</th>
                <th className="text-right px-5 py-3">Tokens In</th>
                <th className="text-right px-5 py-3">Tokens Out</th>
                <th className="text-left px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {aiLogs.map((log) => (
                <tr key={log.id} className="border-b border-gray-800/60">
                  <td className="px-5 py-3 text-gray-300">{log.type}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs font-mono">{log.model}</td>
                  <td className="px-5 py-3 text-right text-gray-300">{log.inputTokens.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right text-gray-300">{log.outputTokens.toLocaleString()}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {aiLogs.length === 0 && <p className="text-center text-gray-500 py-8">No AI usage logs</p>}
        </div>
      )}
    </div>
  )
}
