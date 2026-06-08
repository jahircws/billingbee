import { requireAdminSession } from "@/lib/admin-auth"
import prisma from "@/lib/db"
import { startOfDay, subDays, format } from "date-fns"

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: Promise<{ period?: string; status?: string }>
}

export default async function AdminRevenuePage({ searchParams }: PageProps) {
  await requireAdminSession()
  const { period = "30", status = "all" } = await searchParams

  const days = Number(period) || 30
  const since = subDays(new Date(), days)

  const where: Record<string, unknown> = { createdAt: { gte: since } }
  if (status !== "all") where.status = status

  const [payments, allTime] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        org: { select: { name: true, slug: true } },
        invoice: { select: { invoiceNumber: true } },
        client: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.payment.aggregate({
      where: { status: "succeeded" },
      _sum: { amount: true },
      _count: true,
    }),
  ])

  const succeeded = payments.filter((p) => p.status === "succeeded")
  const periodRevenue = succeeded.reduce((s, p) => s + Number(p.amount), 0)
  const periodCount = succeeded.length
  const allTimeRevenue = Number(allTime._sum.amount ?? 0)
  const allTimeCount = allTime._count

  // Group revenue by day for the period
  const revenueByDay: Record<string, number> = {}
  for (let i = 0; i < days; i++) {
    const d = format(subDays(new Date(), days - 1 - i), "MMM d")
    revenueByDay[d] = 0
  }
  for (const p of succeeded) {
    const d = format(p.createdAt, "MMM d")
    if (d in revenueByDay) revenueByDay[d] += Number(p.amount)
  }

  const fmt = (n: number) =>
    n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Revenue &amp; Transactions</h1>
        <p className="text-gray-400 text-sm mt-1">All payments across all organizations</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: `Revenue (${days}d)`, value: `₹${fmt(periodRevenue)}` },
          { label: `Transactions (${days}d)`, value: periodCount.toLocaleString() },
          { label: "All-time Revenue", value: `₹${fmt(allTimeRevenue)}` },
          { label: "All-time Transactions", value: allTimeCount.toLocaleString() },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className="text-xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <form method="GET" className="flex gap-3 mb-6">
        <select
          name="period"
          defaultValue={period}
          className="bg-gray-900 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last 365 days</option>
        </select>
        <select
          name="status"
          defaultValue={status}
          className="bg-gray-900 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          <option value="all">All statuses</option>
          <option value="succeeded">Succeeded</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          Apply
        </button>
      </form>

      {/* Transactions table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-xs text-gray-400">
              <th className="text-left px-5 py-3 font-medium">Organization</th>
              <th className="text-left px-5 py-3 font-medium">Client</th>
              <th className="text-left px-5 py-3 font-medium">Invoice</th>
              <th className="text-left px-5 py-3 font-medium">Method</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="text-right px-5 py-3 font-medium">Amount</th>
              <th className="text-left px-5 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-gray-800/60 hover:bg-gray-800/30 transition-colors">
                <td className="px-5 py-3">
                  <p className="text-white text-xs font-medium">{p.org.name}</p>
                  <p className="text-gray-500 text-xs">{p.org.slug}</p>
                </td>
                <td className="px-5 py-3 text-gray-300 text-xs">{p.client.name}</td>
                <td className="px-5 py-3 text-gray-400 font-mono text-xs">{p.invoice.invoiceNumber}</td>
                <td className="px-5 py-3 text-gray-400 text-xs capitalize">{p.method.toLowerCase().replace("_", " ")}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.status === "succeeded"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : p.status === "pending"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-red-500/20 text-red-400"
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right text-white font-medium text-xs">
                  {Number(p.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })} {p.currency}
                </td>
                <td className="px-5 py-3 text-gray-400 text-xs">
                  {new Date(p.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && (
          <p className="text-center text-gray-500 py-12">No transactions found</p>
        )}
      </div>
    </div>
  )
}
