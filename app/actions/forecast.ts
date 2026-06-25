"use server"

import db from "@/lib/db"

export interface CurrencyAmount {
  currency: string
  total: number
}

export interface CurrencyAvg {
  currency: string
  avg: number
}

export interface ClientStat {
  clientId: string
  clientName: string
  currency: string
  totalBilled: number
  totalPaid: number
  avgDaysToPay: number | null
  lastInvoiceDate: Date | null
  invoiceCount: number
  hasOpenInvoice: boolean
}

export interface RevenueForecastData {
  paidLast30Days: CurrencyAmount[]
  paidLast90Days: CurrencyAmount[]
  avgMonthlyRevenue: CurrencyAvg[]
  paidInvoiceCount: number
  orgCurrency: string
  totalOutstanding: CurrencyAmount[]
  overdueCount: number
  overdueValue: CurrencyAmount[]
  oldestOverdueDays: number
  clientStats: ClientStat[]
  slowPayers: Array<{ clientName: string; avgDaysToPay: number; outstandingValue: number; currency: string }>
  dormantClients: Array<{ clientName: string; totalPaid: number; currency: string; daysSinceLastInvoice: number }>
  hasSufficientData: boolean
  dataWindowMonths: number
}

function groupByCurrency(invoices: Array<{ total: unknown; currency: string }>): CurrencyAmount[] {
  const map = new Map<string, number>()
  for (const inv of invoices) {
    map.set(inv.currency, (map.get(inv.currency) ?? 0) + Number(inv.total ?? 0))
  }
  return Array.from(map.entries()).map(([currency, total]) => ({ currency, total }))
}

export async function getRevenueForecastData(orgId: string): Promise<RevenueForecastData> {
  const now = new Date()
  const twelveMonthsAgo = new Date(now)
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { currency: true },
  })
  const orgCurrency = String(org?.currency ?? "INR")

  // All-time paid count — used only for the sufficiency gate so orgs with > 12 months history aren't blocked
  const allTimePaidCount = await db.invoice.count({
    where: { orgId, status: "PAID" },
  })

  // Query 1 — paid invoices last 12 months, all currencies
  const paidInvoices = await db.invoice.findMany({
    where: {
      orgId,
      status: "PAID",
      paidAt: { gte: twelveMonthsAgo },
    },
    select: {
      id: true,
      total: true,
      currency: true,
      paidAt: true,
      dueDate: true,
      clientId: true,
      createdAt: true,
      client: { select: { id: true, name: true } },
    },
  })

  // Query 2 — unpaid/overdue invoices, all currencies
  const openInvoices = await db.invoice.findMany({
    where: {
      orgId,
      status: { in: ["UNPAID", "OVERDUE"] },
    },
    select: {
      id: true,
      total: true,
      currency: true,
      dueDate: true,
      createdAt: true,
      clientId: true,
      status: true,
      client: { select: { id: true, name: true } },
    },
  })

  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const ninetyDaysAgo = new Date(now)
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const toNum = (d: unknown) => Number(d ?? 0)

  const paidLast30Days = groupByCurrency(
    paidInvoices.filter((i) => i.paidAt && i.paidAt >= thirtyDaysAgo)
  )
  const paidLast90Days = groupByCurrency(
    paidInvoices.filter((i) => i.paidAt && i.paidAt >= ninetyDaysAgo)
  )
  const avgMonthlyRevenue: CurrencyAvg[] = paidLast90Days.map(({ currency, total }) => ({
    currency,
    avg: total / 3,
  }))

  const totalOutstanding = groupByCurrency(openInvoices)
  const overdueInvoices = openInvoices.filter((i) => i.status === "OVERDUE")
  const overdueValue = groupByCurrency(overdueInvoices)

  const oldestOverdueDays = overdueInvoices.length
    ? Math.max(
        ...overdueInvoices.map((i) =>
          Math.floor((now.getTime() - i.createdAt.getTime()) / 86400000)
        )
      )
    : 0

  // Per-client analysis
  type PaidInv = (typeof paidInvoices)[number]
  type OpenInv = (typeof openInvoices)[number]
  const clientMap = new Map<
    string,
    {
      clientName: string
      paidInvoices: PaidInv[]
      openInvoices: OpenInv[]
    }
  >()

  for (const inv of paidInvoices) {
    const entry = clientMap.get(inv.clientId) ?? {
      clientName: inv.client.name,
      paidInvoices: [] as PaidInv[],
      openInvoices: [] as OpenInv[],
    }
    entry.paidInvoices.push(inv)
    clientMap.set(inv.clientId, entry)
  }

  for (const inv of openInvoices) {
    const entry = clientMap.get(inv.clientId) ?? {
      clientName: inv.client.name,
      paidInvoices: [] as PaidInv[],
      openInvoices: [] as OpenInv[],
    }
    entry.openInvoices.push(inv)
    clientMap.set(inv.clientId, entry)
  }

  const clientStats: ClientStat[] = []

  for (const [clientId, data] of clientMap.entries()) {
    const totalBilled =
      data.paidInvoices.reduce((s, i) => s + toNum(i.total), 0) +
      data.openInvoices.reduce((s, i) => s + toNum(i.total), 0)
    const totalPaid = data.paidInvoices.reduce((s, i) => s + toNum(i.total), 0)

    // Dominant currency = most recent invoice's currency
    const allInvsByDate = [...data.paidInvoices, ...data.openInvoices].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )
    const clientCurrency = allInvsByDate[0]?.currency ?? orgCurrency

    let avgDaysToPay: number | null = null
    if (data.paidInvoices.length >= 2) {
      const days = data.paidInvoices
        .filter((i) => i.paidAt)
        .map((i) => Math.floor((i.paidAt!.getTime() - i.createdAt.getTime()) / 86400000))
      avgDaysToPay = days.length ? days.reduce((a, b) => a + b, 0) / days.length : null
    }

    const allDates = [...data.paidInvoices, ...data.openInvoices].map((i) => i.createdAt)
    const lastInvoiceDate = allDates.length
      ? new Date(Math.max(...allDates.map((d) => d.getTime())))
      : null

    clientStats.push({
      clientId,
      clientName: data.clientName,
      currency: String(clientCurrency),
      totalBilled,
      totalPaid,
      avgDaysToPay,
      lastInvoiceDate,
      invoiceCount: data.paidInvoices.length + data.openInvoices.length,
      hasOpenInvoice: data.openInvoices.length > 0,
    })
  }

  const slowPayers = clientStats
    .filter((c) => c.avgDaysToPay !== null && c.avgDaysToPay > 14 && c.hasOpenInvoice)
    .map((c) => ({
      clientName: c.clientName,
      avgDaysToPay: Math.round(c.avgDaysToPay!),
      currency: c.currency,
      outstandingValue: openInvoices
        .filter((i) => i.clientId === c.clientId)
        .reduce((s, i) => s + toNum(i.total), 0),
    }))

  const sixtyDaysAgo = new Date(now)
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const dormantClients = clientStats
    .filter(
      (c) =>
        c.lastInvoiceDate !== null &&
        c.lastInvoiceDate < sixtyDaysAgo &&
        c.totalPaid > 0 &&
        !c.hasOpenInvoice
    )
    .map((c) => ({
      clientName: c.clientName,
      totalPaid: c.totalPaid,
      currency: c.currency,
      daysSinceLastInvoice: Math.floor(
        (now.getTime() - c.lastInvoiceDate!.getTime()) / 86400000
      ),
    }))

  const dataWindowMonths =
    paidInvoices.length > 0
      ? Math.ceil(
          (now.getTime() -
            Math.min(...paidInvoices.map((i) => i.createdAt.getTime()))) /
            (30 * 86400000)
        )
      : 0

  return {
    paidLast30Days,
    paidLast90Days,
    avgMonthlyRevenue,
    paidInvoiceCount: paidInvoices.length,
    orgCurrency,
    totalOutstanding,
    overdueCount: overdueInvoices.length,
    overdueValue,
    oldestOverdueDays,
    clientStats,
    slowPayers,
    dormantClients,
    hasSufficientData: allTimePaidCount >= 5,
    dataWindowMonths,
  }
}
