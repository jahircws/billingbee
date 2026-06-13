import prisma from "@/lib/db"
import { subMonths, startOfMonth, endOfMonth, differenceInDays } from "date-fns"
import { Currency } from "@/lib/generated/prisma/client"

export interface HealthComponents {
  collectionEfficiency: number // 0-25
  revenueGrowth: number        // 0-20
  clientConcentration: number  // 0-20
  cashflowRisk: number         // 0-20
  paymentVelocity: number      // 0-15
  total: number                // 0-100
  baseCurrency: Currency       // currency all monetary details are expressed in
  limitedData: boolean         // true when there isn't enough history to trust the score
  limitedDataReason: string | null
  details: {
    paidOnTimeRate: number     // fraction of due invoices paid on or before the due date
    momGrowthPct: number
    topClientPct: number
    avgDaysToPay: number       // amount-weighted, in days
    monthlyRevenue: number     // base currency
    prevMonthRevenue: number   // base currency
    outstanding: number        // base currency
  }
}

// Linearly map `value` from [lo, hi] onto [0, max], clamped. Higher value → higher score.
function scaleUp(value: number, lo: number, hi: number, max: number): number {
  if (hi === lo) return max
  const t = (value - lo) / (hi - lo)
  return Math.max(0, Math.min(1, t)) * max
}

// Linearly map `value` from [lo, hi] onto [max, 0], clamped. Higher value → lower score.
function scaleDown(value: number, lo: number, hi: number, max: number): number {
  return max - scaleUp(value, lo, hi, max)
}

export async function calculateHealthScore(orgId: string): Promise<HealthComponents> {
  const now = new Date()
  const thisMonthStart = startOfMonth(now)
  const thisMonthEnd = endOfMonth(now)
  const prevMonthStart = startOfMonth(subMonths(now, 1))
  const prevMonthEnd = endOfMonth(subMonths(now, 1))
  const ninetyDaysAgo = subMonths(now, 3)

  const [org, invoices] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId }, select: { currency: true, createdAt: true } }),
    // One fetch of non-draft invoices in the last 90 days. fxRate lets us express
    // every total in the org's base currency so cross-currency orgs are comparable.
    prisma.invoice.findMany({
      where: { orgId, issueDate: { gte: ninetyDaysAgo }, status: { not: "DRAFT" } },
      select: {
        clientId: true,
        issueDate: true,
        dueDate: true,
        paidAt: true,
        status: true,
        total: true,
        amountDue: true,
        fxRate: true,
      },
    }),
  ])

  const baseCurrency: Currency = org?.currency ?? "INR"
  // Convert a per-invoice amount into the org's base currency.
  const toBase = (amount: unknown, fxRate: unknown) => Number(amount) * Number(fxRate)

  // ── 1. Collection efficiency (25): % of *due* invoices paid on or before due date ──
  const dueInvoices = invoices.filter((i) => i.dueDate && i.dueDate <= now)
  const paidOnTime = dueInvoices.filter(
    (i) => i.status === "PAID" && (!i.paidAt || i.paidAt <= i.dueDate!),
  ).length
  const paidOnTimeRate = dueInvoices.length > 0 ? paidOnTime / dueInvoices.length : 1
  const collectionEfficiency = Math.round(paidOnTimeRate * 25)

  // ── 2. Revenue growth (20): this month vs previous month, base currency ──
  const monthlyRevenue = invoices
    .filter((i) => i.issueDate >= thisMonthStart && i.issueDate <= thisMonthEnd)
    .reduce((s, i) => s + toBase(i.total, i.fxRate), 0)
  const prevMonthRevenue = invoices
    .filter((i) => i.issueDate >= prevMonthStart && i.issueDate <= prevMonthEnd)
    .reduce((s, i) => s + toBase(i.total, i.fxRate), 0)

  let momGrowthPct = 0
  if (prevMonthRevenue > 0) {
    momGrowthPct = ((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
  } else if (monthlyRevenue > 0) {
    momGrowthPct = 100
  }
  // Continuous: -10% → 0pts, +20% → full. When there's no prior month to compare,
  // a "100%" reading is an artifact, not growth — cap at a neutral score.
  const revenueGrowth =
    prevMonthRevenue > 0
      ? Math.round(scaleUp(momGrowthPct, -10, 20, 20))
      : Math.round(scaleUp(Math.min(momGrowthPct, 10), -10, 20, 20))

  // ── 3. Client concentration (20): revenue share of the top client, base currency ──
  const byClient = new Map<string, number>()
  for (const i of invoices) {
    byClient.set(i.clientId, (byClient.get(i.clientId) ?? 0) + toBase(i.total, i.fxRate))
  }
  const totalRevenue90d = [...byClient.values()].reduce((s, v) => s + v, 0)
  const topClientRevenue = byClient.size > 0 ? Math.max(...byClient.values()) : 0
  const topClientPct = totalRevenue90d > 0 ? (topClientRevenue / totalRevenue90d) * 100 : 0
  // ≤50% share → full marks; 100% (single client) → a 4pt floor. Continuous between.
  const clientConcentration = Math.round(
    topClientPct <= 50 ? 20 : 20 - scaleUp(topClientPct, 50, 100, 16),
  )

  // ── 4. Cashflow risk (20): monthly revenue coverage of outstanding receivables ──
  const outstanding = invoices
    .filter((i) => i.status === "UNPAID" || i.status === "OVERDUE")
    .reduce((s, i) => s + toBase(i.amountDue, i.fxRate), 0)
  // No outstanding receivables → no collection risk. Otherwise reward ≥2× coverage.
  const coverage = outstanding <= 0 ? Infinity : monthlyRevenue / outstanding
  const cashflowRisk = outstanding <= 0 ? 20 : Math.round(scaleUp(coverage, 0, 2, 20))

  // ── 5. Payment velocity (15): amount-weighted days from issue to payment ──
  const paidInvoices = invoices.filter((i) => i.status === "PAID" && i.paidAt)
  let avgDaysToPay = 30
  if (paidInvoices.length > 0) {
    let weightSum = 0
    let weightedDays = 0
    for (const i of paidInvoices) {
      const weight = Math.max(toBase(i.total, i.fxRate), 0)
      const days = Math.max(0, differenceInDays(i.paidAt!, i.issueDate))
      weightedDays += days * weight
      weightSum += weight
    }
    avgDaysToPay = weightSum > 0 ? weightedDays / weightSum : 30
  }
  // 0 days → full marks; ~60 days → ~0. Continuous.
  const paymentVelocity = Math.round(scaleDown(avgDaysToPay, 0, 60, 15))

  const total =
    collectionEfficiency + revenueGrowth + clientConcentration + cashflowRisk + paymentVelocity

  // ── Data sufficiency: avoid presenting a confident score on thin history ──
  const orgAgeDays = org?.createdAt ? differenceInDays(now, org.createdAt) : 0
  let limitedDataReason: string | null = null
  if (invoices.length < 5) {
    limitedDataReason = "Fewer than 5 invoices in the last 90 days"
  } else if (prevMonthRevenue === 0) {
    limitedDataReason = "No previous-month revenue to measure growth against"
  } else if (dueInvoices.length === 0) {
    limitedDataReason = "No invoices have come due yet"
  } else if (orgAgeDays < 45) {
    limitedDataReason = "Account is less than 45 days old"
  }

  return {
    collectionEfficiency,
    revenueGrowth,
    clientConcentration,
    cashflowRisk,
    paymentVelocity,
    total,
    baseCurrency,
    limitedData: limitedDataReason !== null,
    limitedDataReason,
    details: {
      paidOnTimeRate,
      momGrowthPct,
      topClientPct,
      avgDaysToPay,
      monthlyRevenue,
      prevMonthRevenue,
      outstanding,
    },
  }
}
