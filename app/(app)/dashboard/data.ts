import { unstable_cache } from "next/cache"
import { startOfMonth, endOfMonth, subMonths, addDays, startOfDay, format } from "date-fns"
import prisma from "@/lib/db"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ActivityEvent {
  type: "invoice_sent" | "payment_received" | "contract_signed" | "proposal_accepted"
  description: string
  timestamp: Date
  href: string
}

export interface DashboardData {
  alertStrip: {
    overdueCount: number                      // all currencies
    overdueByCurrency: Record<string, number> // amounts per currency
    dueSoonCount: number
    dueSoonByCurrency: Record<string, number>
    draftCount: number
    unsignedContractCount: number
  }
  statCards: {
    outstandingByCurrency: Record<string, number>  // e.g. { INR: 60900, USD: 40003 }
    paidThisMonthByCurrency: Record<string, number>
    prevMonthPaidByCurrency: Record<string, number>
    activeProposals: number
    clientCount: number
  }
  revenueChart: Array<{ label: string; paid: number; outstanding: number }>
  recentInvoices: Array<{
    id: string
    invoiceNumber: string
    amountDue: number
    currency: string
    status: string
    createdAt: Date
    dueDate: Date | null
    paidAt: Date | null
    client: { name: string }
  }>
  pendingProposals: Array<{
    id: string
    title: string
    sentAt: Date | null
    client: { name: string }
  }>
  pendingContracts: Array<{
    id: string
    title: string
    sentAt: Date | null
    client: { name: string }
  }>
  topClients: Array<{ name: string; amount: number; currency: string }>
  revenueChartCurrency: string  // which currency the chart displays
  recentActivity: ActivityEvent[]
  expenseSnapshot: {
    thisMonth: number
    lastMonth: number
    topCategory: string | null
  }
  isNewUser: boolean
  invoiceCount: number
}

// ── Safe defaults ─────────────────────────────────────────────────────────────

function emptyData(): DashboardData {
  return {
    alertStrip: {
      overdueCount: 0,
      overdueByCurrency: {},
      dueSoonCount: 0,
      dueSoonByCurrency: {},
      draftCount: 0,
      unsignedContractCount: 0,
    },
    statCards: {
      outstandingByCurrency: {},
      paidThisMonthByCurrency: {},
      prevMonthPaidByCurrency: {},
      activeProposals: 0,
      clientCount: 0,
    },
    revenueChart: [],
    recentInvoices: [],
    pendingProposals: [],
    pendingContracts: [],
    topClients: [],
    revenueChartCurrency: "INR",
    recentActivity: [],
    expenseSnapshot: { thisMonth: 0, lastMonth: 0, topCategory: null },
    isNewUser: true,
    invoiceCount: 0,
  }
}

// ── Revenue chart month ranges ─────────────────────────────────────────────────

function buildMonthRanges(now: Date): Array<{ label: string; start: Date; end: Date }> {
  const months: Array<{ label: string; start: Date; end: Date }> = []
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(now, i)
    months.push({
      label: format(d, "MMM"),
      start: startOfMonth(d),
      end: endOfMonth(d),
    })
  }
  return months
}

// ── Core fetch function ────────────────────────────────────────────────────────

async function _getDashboardData(orgId: string): Promise<DashboardData> {
  try {
    // Fetch org currency first — every monetary query must filter by this.
    // Never mix currencies: ₹ and $ amounts cannot be summed together.
    const orgRow = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { currency: true },
    })
    const orgCurrency = orgRow?.currency ?? "INR"

    const now = new Date()
    const todayStart = startOfDay(now)
    const dueSoonEnd = addDays(now, 7)
    const thisMonthStart = startOfMonth(now)
    const thisMonthEnd = endOfMonth(now)
    const prevMonthStart = startOfMonth(subMonths(now, 1))
    const prevMonthEnd = endOfMonth(subMonths(now, 1))
    const monthRanges = buildMonthRanges(now)

    // Revenue chart: 6 pairs of queries across all currencies.
    // Trend bars are more useful than empty bars — we aggregate all currencies
    // and note "All currencies" in the chart label.
    const chartPaidQueries = monthRanges.map((m) =>
      prisma.payment.aggregate({
        where: {
          orgId,
          paidAt: { gte: m.start, lte: m.end },
        },
        _sum: { amount: true },
      })
    )
    const chartOutstandingQueries = monthRanges.map((m) =>
      prisma.invoice.aggregate({
        where: {
          orgId,
          issueDate: { gte: m.start, lte: m.end },
          status: { in: ["UNPAID", "OVERDUE"] },
        },
        _sum: { amountDue: true },
      })
    )

    const [
      overdueAgg,
      dueSoonAgg,
      invoiceCount,
      draftCount,
      unsignedContractCount,
      outstandingAgg,
      paidThisMonthAgg,
      activeProposals,
      clientCount,
      recentInvoices,
      pendingProposals,
      pendingContracts,
      thisMonthPayments,
      expenseThisMonth,
      expenseLastMonth,
      expenseTopCategory,
      activityInvoices,
      activityPayments,
      activityContracts,
      activityProposals,
      prevMonthPaidAgg,
      ...chartResults
    ] = await Promise.all([
      // Alert strip — groupBy currency to get counts + amounts per currency
      prisma.invoice.groupBy({
        by: ["currency"],
        where: {
          orgId,
          OR: [
            { status: "OVERDUE" },
            { status: "UNPAID", dueDate: { lt: todayStart } },
          ],
        },
        _count: { _all: true },
        _sum: { amountDue: true },
      }),
      prisma.invoice.groupBy({
        by: ["currency"],
        where: {
          orgId,
          status: "UNPAID",
          dueDate: { gte: todayStart, lte: dueSoonEnd },
        },
        _count: { _all: true },
        _sum: { amountDue: true },
      }),
      prisma.invoice.count({ where: { orgId } }),
      prisma.invoice.count({ where: { orgId, status: "DRAFT" } }),
      prisma.contract.count({
        where: { orgId, status: "SENT", signedAt: null },
      }),

      // Stat cards — groupBy currency so all currencies are represented
      prisma.invoice.groupBy({
        by: ["currency"],
        where: { orgId, status: { in: ["UNPAID", "OVERDUE"] } },
        _sum: { amountDue: true },
      }),
      prisma.payment.groupBy({
        by: ["currency"],
        where: {
          orgId,
          createdAt: { gte: thisMonthStart, lte: thisMonthEnd },
        },
        _sum: { amount: true },
      }),
      prisma.proposal.count({ where: { orgId, status: { in: ["SENT", "ACCEPTED"] } } }),
      prisma.client.count({ where: { orgId } }),

      // Recent invoices — all currencies shown (with per-row currency)
      prisma.invoice.findMany({
        where: { orgId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          invoiceNumber: true,
          amountDue: true,
          currency: true,
          status: true,
          createdAt: true,
          dueDate: true,
          paidAt: true,
          client: { select: { name: true } },
        },
      }),

      // Pending proposals
      prisma.proposal.findMany({
        where: { orgId, status: "SENT" },
        orderBy: { sentAt: "asc" },
        take: 5,
        select: {
          id: true,
          title: true,
          sentAt: true,
          client: { select: { name: true } },
        },
      }),

      // Pending contracts
      prisma.contract.findMany({
        where: { orgId, status: "SENT", signedAt: null },
        orderBy: { sentAt: "asc" },
        take: 5,
        select: {
          id: true,
          title: true,
          sentAt: true,
          client: { select: { name: true } },
        },
      }),

      // Top clients: all currencies — each payment carries its own currency
      prisma.payment.findMany({
        where: {
          orgId,
          createdAt: { gte: thisMonthStart, lte: thisMonthEnd },
        },
        select: {
          amount: true,
          currency: true,
          invoice: {
            select: {
              client: { select: { id: true, name: true } },
            },
          },
        },
      }),

      // Expense snapshot — all currencies
      prisma.expense.aggregate({
        where: { orgId, date: { gte: thisMonthStart, lte: thisMonthEnd } },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { orgId, date: { gte: prevMonthStart, lte: prevMonthEnd } },
        _sum: { amount: true },
      }),
      prisma.expense.groupBy({
        by: ["categoryId"],
        where: { orgId, date: { gte: thisMonthStart, lte: thisMonthEnd } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: 1,
      }),

      // Activity feed queries
      prisma.invoice.findMany({
        where: { orgId, sentAt: { not: null } },
        orderBy: { sentAt: "desc" },
        take: 8,
        select: {
          id: true,
          invoiceNumber: true,
          sentAt: true,
          client: { select: { name: true } },
        },
      }),
      prisma.payment.findMany({
        where: { orgId },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          amount: true,
          createdAt: true,
          invoice: { select: { client: { select: { name: true } } } },
        },
      }),
      prisma.contract.findMany({
        where: { orgId, signedAt: { not: null } },
        orderBy: { signedAt: "desc" },
        take: 8,
        select: {
          id: true,
          title: true,
          signedAt: true,
          client: { select: { name: true } },
        },
      }),
      prisma.proposal.findMany({
        where: { orgId, acceptedAt: { not: null } },
        orderBy: { acceptedAt: "desc" },
        take: 8,
        select: {
          id: true,
          title: true,
          acceptedAt: true,
          client: { select: { name: true } },
        },
      }),

      // Previous month paid — for trend pill on stat card
      prisma.payment.groupBy({
        by: ["currency"],
        where: {
          orgId,
          createdAt: { gte: prevMonthStart, lte: prevMonthEnd },
        },
        _sum: { amount: true },
      }),

      // Revenue chart queries (12 queries: 6 paid + 6 outstanding)
      ...chartPaidQueries,
      ...chartOutstandingQueries,
    ])

    // ── Process revenue chart ─────────────────────────────────────────────────
    const chartPaidResults = chartResults.slice(0, 6) as Awaited<ReturnType<typeof prisma.payment.aggregate>>[]
    const chartOutstandingResults = chartResults.slice(6, 12) as Awaited<ReturnType<typeof prisma.invoice.aggregate>>[]

    const revenueChart = monthRanges.map((m, i) => ({
      label: m.label,
      paid: Number(chartPaidResults[i]?._sum?.amount ?? 0),
      outstanding: Number(chartOutstandingResults[i]?._sum?.amountDue ?? 0),
    }))

    // ── Process top clients — group by clientId + currency ───────────────────
    // Key: `${clientId}::${currency}` so USD and INR payments for the same
    // client are tracked separately (amounts cannot be summed cross-currency).
    const clientTotals = new Map<string, { name: string; amount: number; currency: string }>()
    for (const p of thisMonthPayments) {
      const client = p.invoice?.client
      if (!client) continue
      const key = `${client.id}::${p.currency}`
      const existing = clientTotals.get(key) ?? { name: client.name, amount: 0, currency: p.currency as string }
      existing.amount += Number(p.amount)
      clientTotals.set(key, existing)
    }
    // Sort by numeric amount (best we can do without FX normalisation)
    const topClients = [...clientTotals.values()]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    // ── Process expense top category ──────────────────────────────────────────
    let topCategoryName: string | null = null
    if (expenseTopCategory.length > 0 && expenseTopCategory[0].categoryId) {
      const cat = await prisma.category.findUnique({
        where: { id: expenseTopCategory[0].categoryId },
        select: { name: true },
      })
      topCategoryName = cat?.name ?? null
    }

    // ── Process activity feed ─────────────────────────────────────────────────
    const events: ActivityEvent[] = [
      ...activityInvoices.map((inv) => ({
        type: "invoice_sent" as const,
        description: `Invoice ${inv.invoiceNumber} sent to ${inv.client.name}`,
        timestamp: inv.sentAt!,
        href: `/invoices/${inv.id}`,
      })),
      ...activityPayments.map((p) => ({
        type: "payment_received" as const,
        description: `Payment received from ${p.invoice?.client?.name ?? "client"}`,
        timestamp: p.createdAt,
        href: "/invoices?status=PAID",
      })),
      ...activityContracts.map((c) => ({
        type: "contract_signed" as const,
        description: `${c.client.name} signed "${c.title}"`,
        timestamp: c.signedAt!,
        href: `/contracts/${c.id}`,
      })),
      ...activityProposals.map((p) => ({
        type: "proposal_accepted" as const,
        description: `${p.client.name} accepted "${p.title}"`,
        timestamp: p.acceptedAt!,
        href: `/proposals/${p.id}`,
      })),
    ]
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    const recentActivity = events.slice(0, 8)

    // ── Shape return value ────────────────────────────────────────────────────
    const normalizedInvoices = recentInvoices.map((inv) => ({
      ...inv,
      amountDue: Number(inv.amountDue),
      currency: inv.currency as string,
      dueDate: inv.dueDate ?? null,
    }))

    const isNewUser = normalizedInvoices.length === 0 && clientCount === 0

    // Helper: collapse groupBy rows into Record<currency, amount>
    type GroupByRow = { currency: string; _count: { _all: number }; _sum: { amountDue?: unknown } }
    type PayGroupByRow = { currency: string; _sum: { amount?: unknown } }

    function toAmountMap(rows: GroupByRow[]): Record<string, number> {
      const m: Record<string, number> = {}
      for (const r of rows) m[r.currency as string] = Number(r._sum.amountDue ?? 0)
      return m
    }
    function toPayAmountMap(rows: PayGroupByRow[]): Record<string, number> {
      const m: Record<string, number> = {}
      for (const r of rows) m[r.currency as string] = Number(r._sum.amount ?? 0)
      return m
    }
    function totalCount(rows: GroupByRow[]): number {
      return rows.reduce((s, r) => s + r._count._all, 0)
    }

    return {
      alertStrip: {
        overdueCount: totalCount(overdueAgg as unknown as GroupByRow[]),
        overdueByCurrency: toAmountMap(overdueAgg as unknown as GroupByRow[]),
        dueSoonCount: totalCount(dueSoonAgg as unknown as GroupByRow[]),
        dueSoonByCurrency: toAmountMap(dueSoonAgg as unknown as GroupByRow[]),
        draftCount,
        unsignedContractCount,
      },
      statCards: {
        outstandingByCurrency: toAmountMap(outstandingAgg as unknown as GroupByRow[]),
        paidThisMonthByCurrency: toPayAmountMap(paidThisMonthAgg as unknown as PayGroupByRow[]),
        prevMonthPaidByCurrency: toPayAmountMap(prevMonthPaidAgg as unknown as PayGroupByRow[]),
        activeProposals,
        clientCount,
      },
      revenueChart,
      revenueChartCurrency: orgCurrency as string,
      recentInvoices: normalizedInvoices,
      pendingProposals,
      pendingContracts,
      topClients,
      recentActivity,
      expenseSnapshot: {
        thisMonth: Number(expenseThisMonth._sum.amount ?? 0),
        lastMonth: Number(expenseLastMonth._sum.amount ?? 0),
        topCategory: topCategoryName,
      },
      isNewUser,
      invoiceCount,
    }
  } catch (err) {
    console.error("[getDashboardData] failed:", err)
    return emptyData()
  }
}

// ── Cached export ─────────────────────────────────────────────────────────────

export const getDashboardData = unstable_cache(
  _getDashboardData,
  ["dashboard-data"],
  { revalidate: 300 }
)
