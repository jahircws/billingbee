import prisma from "@/lib/db"
import { subMonths, startOfMonth, endOfMonth } from "date-fns"

export interface HealthComponents {
  collectionEfficiency: number // 0-25
  revenueGrowth: number        // 0-20
  clientConcentration: number  // 0-20
  cashflowRisk: number         // 0-20
  paymentVelocity: number      // 0-15
  total: number                // 0-100
  details: {
    paidOnTimeRate: number
    momGrowthPct: number
    topClientPct: number
    avgDaysToPay: number
    monthlyRevenue: number
    prevMonthRevenue: number
  }
}

export async function calculateHealthScore(orgId: string): Promise<HealthComponents> {
  const now = new Date()
  const thisMonthStart = startOfMonth(now)
  const thisMonthEnd = endOfMonth(now)
  const prevMonthStart = startOfMonth(subMonths(now, 1))
  const prevMonthEnd = endOfMonth(subMonths(now, 1))
  const ninetyDaysAgo = subMonths(now, 3)

  const [recentInvoices, thisMonthInvoices, prevMonthInvoices, payments, clientTotals] =
    await Promise.all([
      // Invoices in last 90 days for collection efficiency + velocity
      prisma.invoice.findMany({
        where: { orgId, issueDate: { gte: ninetyDaysAgo }, status: { in: ["PAID", "UNPAID", "OVERDUE"] } },
        select: { id: true, dueDate: true, status: true, total: true, clientId: true },
      }),
      // This month revenue
      prisma.invoice.aggregate({
        where: { orgId, issueDate: { gte: thisMonthStart, lte: thisMonthEnd }, status: { not: "DRAFT" } },
        _sum: { total: true },
      }),
      // Previous month revenue
      prisma.invoice.aggregate({
        where: { orgId, issueDate: { gte: prevMonthStart, lte: prevMonthEnd }, status: { not: "DRAFT" } },
        _sum: { total: true },
      }),
      // Payments for velocity
      prisma.payment.findMany({
        where: { invoice: { orgId }, createdAt: { gte: ninetyDaysAgo } },
        include: { invoice: { select: { issueDate: true } } },
      }),
      // Client revenue concentration
      prisma.invoice.groupBy({
        by: ["clientId"],
        where: { orgId, issueDate: { gte: ninetyDaysAgo }, status: { not: "DRAFT" } },
        _sum: { total: true },
      }),
    ])

  // 1. Collection efficiency (25pts): % of invoices paid among those due in 90d
  const dueInvoices = recentInvoices.filter((i) => i.dueDate && i.dueDate <= now)
  const paidOnTime = dueInvoices.filter((i) => i.status === "PAID").length
  const paidOnTimeRate = dueInvoices.length > 0 ? paidOnTime / dueInvoices.length : 1
  const collectionEfficiency = Math.round(paidOnTimeRate * 25)

  // 2. Revenue growth (20pts)
  const monthlyRevenue = Number(thisMonthInvoices._sum.total ?? 0)
  const prevMonthRevenue = Number(prevMonthInvoices._sum.total ?? 0)
  let momGrowthPct = 0
  if (prevMonthRevenue > 0) {
    momGrowthPct = ((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
  } else if (monthlyRevenue > 0) {
    momGrowthPct = 100
  }
  const revenueGrowth = momGrowthPct >= 20
    ? 20
    : momGrowthPct >= 10
    ? 15
    : momGrowthPct >= 0
    ? 10
    : momGrowthPct >= -10
    ? 5
    : 0

  // 3. Client concentration (20pts): penalty if top client > 50%
  const totalRevenue90d = clientTotals.reduce((s, c) => s + Number(c._sum.total ?? 0), 0)
  const topClientRevenue = clientTotals.reduce((max, c) => Math.max(max, Number(c._sum.total ?? 0)), 0)
  const topClientPct = totalRevenue90d > 0 ? (topClientRevenue / totalRevenue90d) * 100 : 0
  const clientConcentration = topClientPct > 80 ? 5 : topClientPct > 60 ? 10 : topClientPct > 50 ? 15 : 20

  // 4. Cashflow risk (20pts): outstanding vs monthly revenue
  const outstanding = recentInvoices
    .filter((i) => i.status === "UNPAID" || i.status === "OVERDUE")
    .reduce((s, i) => s + Number(i.total), 0)
  const runway = monthlyRevenue > 0 ? (monthlyRevenue / Math.max(outstanding, 1)) : 1
  const cashflowRisk = runway >= 2 ? 20 : runway >= 1 ? 15 : runway >= 0.5 ? 10 : 5

  // 5. Payment velocity (15pts): avg days to pay vs 30-day benchmark
  let avgDaysToPay = 30
  if (payments.length > 0) {
    const totalDays = payments.reduce((s, p) => {
      const days = (new Date(p.createdAt).getTime() - new Date(p.invoice.issueDate).getTime()) / 86400000
      return s + Math.max(0, days)
    }, 0)
    avgDaysToPay = totalDays / payments.length
  }
  const paymentVelocity = avgDaysToPay <= 14 ? 15 : avgDaysToPay <= 21 ? 12 : avgDaysToPay <= 30 ? 9 : avgDaysToPay <= 45 ? 6 : 3

  const total = collectionEfficiency + revenueGrowth + clientConcentration + cashflowRisk + paymentVelocity

  return {
    collectionEfficiency,
    revenueGrowth,
    clientConcentration,
    cashflowRisk,
    paymentVelocity,
    total,
    details: {
      paidOnTimeRate,
      momGrowthPct,
      topClientPct,
      avgDaysToPay,
      monthlyRevenue,
      prevMonthRevenue,
    },
  }
}
