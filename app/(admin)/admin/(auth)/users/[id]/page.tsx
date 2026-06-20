import { requireAdminSession } from "@/lib/admin-auth"
import prisma from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function AdminUserDetailPage({ params, searchParams }: PageProps) {
  await requireAdminSession()
  const { id } = await params
  const { tab = "overview" } = await searchParams

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      orgUsers: {
        include: {
          org: {
            include: { _count: { select: { invoices: true, clients: true } } },
          },
        },
      },
    },
  })
  if (!user) notFound()

  const [aiLogs, activityInvoices, activityAiLogs] = await Promise.all([
    tab === "ai"
      ? prisma.aIUsageLog.findMany({
          where: { orgId: { in: user.orgUsers.map((ou) => ou.orgId) } },
          orderBy: { createdAt: "desc" },
          take: 100,
        })
      : Promise.resolve([]),
    tab === "activity"
      ? prisma.invoice.findMany({
          where: { orgId: { in: user.orgUsers.map((ou) => ou.orgId) } },
          orderBy: { createdAt: "desc" },
          take: 30,
          select: { id: true, invoiceNumber: true, status: true, createdAt: true, orgId: true },
        })
      : Promise.resolve([]),
    tab === "activity"
      ? prisma.aIUsageLog.findMany({
          where: { orgId: { in: user.orgUsers.map((ou) => ou.orgId) } },
          orderBy: { createdAt: "desc" },
          take: 20,
          select: { id: true, type: true, createdAt: true },
        })
      : Promise.resolve([]),
  ])

  const TABS = ["overview", "orgs", "ai", "activity"]

  // Build activity feed
  type ActivityEvent = { id: string; date: Date; icon: string; color: string; label: string; sub?: string }
  const activityFeed: ActivityEvent[] = []
  if (tab === "activity") {
    for (const inv of activityInvoices) {
      activityFeed.push({
        id: `inv-${inv.id}`,
        date: inv.createdAt,
        icon: "📄",
        color: "text-blue-400",
        label: `Invoice ${inv.invoiceNumber} created`,
        sub: inv.status,
      })
    }
    for (const ai of activityAiLogs) {
      activityFeed.push({
        id: `ai-${ai.id}`,
        date: ai.createdAt,
        icon: "🤖",
        color: "text-purple-400",
        label: `AI call — ${ai.type}`,
      })
    }
    for (const ou of user.orgUsers) {
      if (ou.joinedAt) {
        activityFeed.push({
          id: `join-${ou.id}`,
          date: ou.joinedAt,
          icon: "🏢",
          color: "text-yellow-400",
          label: `Joined ${ou.org.name}`,
          sub: ou.role.toLowerCase(),
        })
      }
    }
    activityFeed.sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  const totalInvoices = user.orgUsers.reduce((sum, ou) => sum + ou.org._count.invoices, 0)

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/admin/users" className="text-gray-500 text-sm hover:text-gray-300">
          ← Users
        </Link>
        <h1 className="text-2xl font-bold text-white mt-2">{user.name ?? user.email}</h1>
        <p className="text-gray-400 text-sm">{user.email}</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-800">
        {TABS.map((t) => (
          <Link
            key={t}
            href={`/admin/users/${id}?tab=${t}`}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "text-emerald-400 border-b-2 border-emerald-400"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {t === "ai" ? "AI Usage" : t === "orgs" ? "Organizations" : t}
          </Link>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="grid grid-cols-2 gap-4">
          {[
            ["Email", user.email],
            ["Name", user.name ?? "—"],
            ["Last Login", user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"],
            ["Joined", new Date(user.createdAt).toLocaleString()],
            ["Organizations", user.orgUsers.length.toString()],
            ["Total Invoices", totalInvoices.toString()],
            ["Auth Method", user.passwordHash ? "Password" : "OAuth / Magic link"],
            ["Email Verified", user.emailVerified ? new Date(user.emailVerified).toLocaleDateString() : "No"],
          ].map(([label, value]) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className="text-sm font-medium text-white">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Organizations */}
      {tab === "orgs" && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-400">
                <th className="text-left px-5 py-3">Organization</th>
                <th className="text-left px-5 py-3">Role</th>
                <th className="text-right px-5 py-3">Invoices</th>
                <th className="text-right px-5 py-3">Clients</th>
                <th className="text-left px-5 py-3">Plan</th>
                <th className="text-left px-5 py-3">Joined</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {user.orgUsers.map((ou) => (
                <tr key={ou.id} className="border-b border-gray-800/60 hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-white">{ou.org.name}</p>
                    <p className="text-gray-500 text-xs">{ou.org.slug}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs capitalize">{ou.role.toLowerCase()}</td>
                  <td className="px-5 py-3 text-right text-gray-300">{ou.org._count.invoices}</td>
                  <td className="px-5 py-3 text-right text-gray-300">{ou.org._count.clients}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      ou.org.plan === "pro" ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-700 text-gray-400"
                    }`}>{ou.org.plan}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {ou.joinedAt ? new Date(ou.joinedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/admin/orgs/${ou.orgId}`}
                      className="text-emerald-400 hover:text-emerald-300 text-xs font-medium"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {user.orgUsers.length === 0 && <p className="text-center text-gray-500 py-8">No organizations</p>}
        </div>
      )}

      {/* AI Usage */}
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

      {/* Activity */}
      {tab === "activity" && (
        <div className="space-y-1">
          {activityFeed.length === 0 && (
            <p className="text-center text-gray-500 py-12">No activity yet</p>
          )}
          {activityFeed.map((event) => (
            <div key={event.id} className="flex items-start gap-4 px-4 py-3 rounded-lg hover:bg-gray-800/30 transition-colors">
              <span className="text-lg mt-0.5 w-6 flex-shrink-0">{event.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${event.color}`}>{event.label}</p>
                {event.sub && <p className="text-xs text-gray-500 capitalize mt-0.5">{event.sub}</p>}
              </div>
              <p className="text-xs text-gray-500 flex-shrink-0 mt-1">
                {new Date(event.date).toLocaleDateString()}{" "}
                {new Date(event.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
