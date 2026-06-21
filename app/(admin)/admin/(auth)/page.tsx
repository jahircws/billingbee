import { requireAdminSession } from "@/lib/admin-auth"
import prisma from "@/lib/db"
import { startOfDay, subDays, format, startOfMonth, subMonths } from "date-fns"
import OverviewCharts from "./OverviewCharts"

export const dynamic = "force-dynamic"

export default async function AdminOverviewPage() {
  await requireAdminSession()

  const now = new Date()
  const todayStart = startOfDay(now)
  const thirtyDaysAgo = subDays(now, 30)

  // Build 6-month MAU windows
  const mauMonths = Array.from({ length: 6 }, (_, i) => {
    const start = startOfMonth(subMonths(now, 5 - i))
    const end = startOfMonth(subMonths(now, 4 - i))
    return { label: format(start, "MMM yyyy"), start, end }
  })

  const [totalOrgs, totalUsers, totalInvoices, proOrgs, aiToday, currentMonthMau, ...mauHistorical] =
    await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
      prisma.invoice.count(),
      prisma.organization.count({ where: { plan: "pro" } }),
      prisma.aIUsageLog.count({ where: { createdAt: { gte: todayStart } } }),
      // Current month MAU
      (async () => {
        const activeOrgIds = await prisma.invoice.findMany({
          where: { createdAt: { gte: startOfMonth(now) } },
          select: { orgId: true },
          distinct: ["orgId"],
        })
        const ids = activeOrgIds.map((r) => r.orgId)
        if (ids.length === 0) return 0
        return prisma.orgUser.count({ where: { orgId: { in: ids }, isActive: true } })
      })(),
      // Historical MAU per month
      ...mauMonths.map(({ start, end }) =>
        (async () => {
          const activeOrgIds = await prisma.invoice.findMany({
            where: { createdAt: { gte: start, lt: end } },
            select: { orgId: true },
            distinct: ["orgId"],
          })
          const ids = activeOrgIds.map((r) => r.orgId)
          if (ids.length === 0) return 0
          return prisma.orgUser.count({ where: { orgId: { in: ids }, isActive: true } })
        })()
      ),
    ])

  // MRR estimate: pro orgs × $9.99
  const mrr = proOrgs * 9.99

  // New signups per day (last 30 days)
  const rawSignups = await prisma.organization.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  })

  // Group by day
  const signupMap: Record<string, number> = {}
  for (let i = 0; i < 30; i++) {
    const d = format(subDays(now, 29 - i), "MMM d")
    signupMap[d] = 0
  }
  for (const o of rawSignups) {
    const d = format(o.createdAt, "MMM d")
    if (d in signupMap) signupMap[d]++
  }
  const signupChart = Object.entries(signupMap).map(([date, count]) => ({ date, count }))

  // /generate conversions: orgs with acquisitionSource
  const generatorConversions = await prisma.organization.count({
    where: { acquisitionSource: { not: null } },
  })

  const mauData = mauMonths.map(({ label }, i) => ({ month: label, users: mauHistorical[i] as number }))

  const stats = [
    { label: "Organizations", value: totalOrgs.toLocaleString() },
    { label: "Users", value: totalUsers.toLocaleString() },
    { label: "MAU (This Month)", value: currentMonthMau.toLocaleString() },
    { label: "Total Invoices", value: totalInvoices.toLocaleString() },
    { label: "MRR", value: `$${mrr.toLocaleString("en-US", { minimumFractionDigits: 0 })}` },
    { label: "AI Calls Today", value: aiToday.toLocaleString() },
    { label: "/generate Conversions", value: generatorConversions.toLocaleString() },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-gray-400 text-sm mt-1">Real-time metrics across all organizations</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {stats.map(({ label, value }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <OverviewCharts data={signupChart} mauData={mauData} />
    </div>
  )
}
