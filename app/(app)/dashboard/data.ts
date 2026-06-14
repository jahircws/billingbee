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
    overdueCount: number
    overdueAmount: number
    dueSoonCount: number
    dueSoonAmount: number
    draftCount: number
    unsignedContractCount: number
  }
  statCards: {
    outstanding: number
    paidThisMonth: number
    activeProposals: number
    clientCount: number
  }
  revenueChart: Array<{ label: string; paid: number; outstanding: number }>
  recentInvoices: Array<{
    id: string
    invoiceNumber: string
    amountDue: number
    status: string
    createdAt: Date
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
  topClients: Array<{ name: string; amount: number; pct: number }>
  recentActivity: ActivityEvent[]
  expenseSnapshot: {
    thisMonth: number
    lastMonth: number
    topCategory: string | null
  }
  isNewUser: boolean
}

// ── Safe defaults ─────────────────────────────────────────────────────────────

function emptyData(): DashboardData {
  return {
    alertStrip: {
      overdueCount: 0,
      overdueAmount: 0,
      dueSoonCount: 0,
      dueSoonAmount: 0,
      draftCount: 0,
      unsignedContractCount: 0,
    },
    statCards: {
      outstanding: 0,
      paidThisMonth: 0,
      activeProposals: 0,
      clientCount: 0,
    },
    revenueChart: [],
    recentInvoices: [],
    pendingProposals: [],
    pendingContracts: [],
    topClients: [],
    recentActivity: [],
    expenseSnapshot: { thisMonth: 0, lastMonth: 0, topCategory: null },
    isNewUser: true,
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
    const now = new Date()
    const todayStart = startOfDay(now)
    const dueSoonEnd = addDays(now, 7)
    const thisMonthStart = startOfMonth(now)
    const thisMonthEnd = endOfMonth(now)
    const prevMonthStart = startOfMonth(subMonths(now, 1))
    const prevMonthEnd = endOfMonth(subMonths(now, 1))
    const monthRanges = buildMonthRanges(now)

    // Revenue chart: 6 pairs of queries (paid + outstanding per month)
    const chartPaidQueries = monthRanges.map((m) =>
      prisma.payment.aggregate({
        where: {
          invoice: { orgId },
          createdAt: { gte: m.start, lte: m.end },
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
      ...chartResults
    ] = await Promise.all([
      // Alert strip
      prisma.invoice.aggregate({
        where: {
          orgId,
          OR: [
            { status: "OVERDUE" },
            { status: "UNPAID", dueDate: { lt: todayStart } },
          ],
        },
        _count: true,
        _sum: { amountDue: true },
      }),
      prisma.invoice.aggregate({
        where: {
          orgId,
          status: "UNPAID",
          dueDate: { gte: todayStart, lte: dueSoonEnd },
        },
        _count: true,
        _sum: { amountDue: true },
      }),
      prisma.invoice.count({ where: { orgId, status: "DRAFT" } }),
      prisma.contract.count({
        where: { orgId, status: "SENT", signedAt: null },
      }),

      // Stat cards
      prisma.invoice.aggregate({
        where: { orgId, status: { in: ["UNPAID", "OVERDUE"] } },
        _sum: { amountDue: true },
      }),
      prisma.payment.aggregate({
        where: {
          orgId,
          createdAt: { gte: thisMonthStart, lte: thisMonthEnd },
        },
        _sum: { amount: true },
      }),
      prisma.proposal.count({ where: { orgId, status: "SENT" } }),
      prisma.client.count({ where: { orgId } }),

      // Recent invoices
      prisma.invoice.findMany({
        where: { orgId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          invoiceNumber: true,
          amountDue: true,
          status: true,
          createdAt: true,
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

      // Top clients: payments this month via invoice
      prisma.payment.findMany({
        where: {
          orgId,
          createdAt: { gte: thisMonthStart, lte: thisMonthEnd },
        },
        select: {
          amount: true,
          invoice: {
            select: {
              client: { select: { id: true, name: true } },
            },
          },
        },
      }),

      // Expense snapshot
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

    // ── Process top clients ───────────────────────────────────────────────────
    const clientTotals = new Map<string, { name: string; amount: number }>()
    for (const p of thisMonthPayments) {
      const client = p.invoice?.client
      if (!client) continue
      const existing = clientTotals.get(client.id) ?? { name: client.name, amount: 0 }
      existing.amount += Number(p.amount)
      clientTotals.set(client.id, existing)
    }
    const sortedClients = [...clientTotals.values()].sort((a, b) => b.amount - a.amount).slice(0, 5)
    const topAmount = sortedClients[0]?.amount ?? 0
    const topClients = sortedClients.map((c) => ({
      name: c.name,
      amount: c.amount,
      pct: topAmount > 0 ? Math.round((c.amount / topAmount) * 100) : 0,
    }))

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
    }))

    const isNewUser = normalizedInvoices.length === 0 && clientCount === 0

    return {
      alertStrip: {
        overdueCount: overdueAgg._count,
        overdueAmount: Number(overdueAgg._sum.amountDue ?? 0),
        dueSoonCount: dueSoonAgg._count,
        dueSoonAmount: Number(dueSoonAgg._sum.amountDue ?? 0),
        draftCount,
        unsignedContractCount,
      },
      statCards: {
        outstanding: Number(outstandingAgg._sum.amountDue ?? 0),
        paidThisMonth: Number(paidThisMonthAgg._sum.amount ?? 0),
        activeProposals,
        clientCount,
      },
      revenueChart,
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
