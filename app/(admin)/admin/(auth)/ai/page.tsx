import { requireAdminSession } from "@/lib/admin-auth"
import prisma from "@/lib/db"
import { startOfDay, subDays, format } from "date-fns"
import AIUsageCharts from "./AIUsageCharts"

export const dynamic = "force-dynamic"

const HAIKU_INPUT_COST = 0.25 / 1_000_000
const HAIKU_OUTPUT_COST = 1.25 / 1_000_000

export default async function AdminAIPage() {
  await requireAdminSession()

  const now = new Date()
  const thirtyDaysAgo = subDays(now, 30)

  const [totalCalls, allLogs] = await Promise.all([
    prisma.aIUsageLog.count(),
    prisma.aIUsageLog.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: {
        type: true,
        inputTokens: true,
        outputTokens: true,
        createdAt: true,
        orgId: true,
        org: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const totalInputTokens = allLogs.reduce((s, l) => s + l.inputTokens, 0)
  const totalOutputTokens = allLogs.reduce((s, l) => s + l.outputTokens, 0)
  const estimatedCost = totalInputTokens * HAIKU_INPUT_COST + totalOutputTokens * HAIKU_OUTPUT_COST

  // By type
  const byType: Record<string, number> = {}
  for (const l of allLogs) {
    byType[l.type] = (byType[l.type] ?? 0) + 1
  }

  // Per day chart
  const dayMap: Record<string, number> = {}
  for (let i = 0; i < 30; i++) {
    dayMap[format(subDays(now, 29 - i), "MMM d")] = 0
  }
  for (const l of allLogs) {
    const d = format(l.createdAt, "MMM d")
    if (d in dayMap) dayMap[d]++
  }
  const dailyChart = Object.entries(dayMap).map(([date, count]) => ({ date, count }))

  // Top orgs by usage
  const orgUsage: Record<string, { name: string; count: number }> = {}
  for (const l of allLogs) {
    if (!l.orgId) continue
    if (!orgUsage[l.orgId]) orgUsage[l.orgId] = { name: (l.org as unknown as { name: string })?.name ?? l.orgId, count: 0 }
    orgUsage[l.orgId].count++
  }
  const topOrgs = Object.entries(orgUsage)
    .map(([id, { name, count }]) => ({ id, name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">AI Usage</h1>
        <p className="text-gray-400 text-sm mt-1">Last 30 days across all organizations</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total API Calls (all time)", value: totalCalls.toLocaleString() },
          { label: "Input Tokens (30d)", value: totalInputTokens.toLocaleString() },
          { label: "Output Tokens (30d)", value: totalOutputTokens.toLocaleString() },
          { label: "Est. Cost (30d)", value: `$${estimatedCost.toFixed(2)}` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className="text-xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* By type */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        {Object.entries(byType).map(([type, count]) => (
          <div key={type} className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-400 mb-1 capitalize">{type}</p>
            <p className="text-lg font-bold text-emerald-400">{count.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Daily chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">API Calls Per Day</h2>
        <AIUsageCharts data={dailyChart} />
      </div>

      {/* Top orgs */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-gray-300">Top Organizations by AI Usage</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-xs text-gray-400">
              <th className="text-left px-5 py-3">Organization</th>
              <th className="text-right px-5 py-3">Calls (30d)</th>
            </tr>
          </thead>
          <tbody>
            {topOrgs.map((o) => (
              <tr key={o.id} className="border-b border-gray-800/60 hover:bg-gray-800/30">
                <td className="px-5 py-3 text-gray-200">{o.name}</td>
                <td className="px-5 py-3 text-right text-emerald-400 font-medium">{o.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {topOrgs.length === 0 && <p className="text-center text-gray-500 py-8">No AI usage logs yet</p>}
      </div>
    </div>
  )
}
