"use server"

import db from "@/lib/db"

export interface ClientStat {
  clientId: string
  clientName: string
  totalBilled: number
  totalPaid: number
  avgDaysToPay: number | null
  lastInvoiceDate: Date | null
  invoiceCount: number
  hasOpenInvoice: boolean
}

export interface RevenueForecastData {
  totalPaidLast30Days: number
  totalPaidLast90Days: number
  avgMonthlyRevenue: number
  paidInvoiceCount: number
  currency: string
  totalOutstanding: number
  overdueCount: number
  overdueValue: number
  oldestOverdueDays: number
  clientStats: ClientStat[]
  slowPayers: Array<{ clientName: string; avgDaysToPay: number; outstandingValue: number }>
  dormantClients: Array<{ clientName: string; totalPaid: number; daysSinceLastInvoice: number }>
  hasSufficientData: boolean
  dataWindowMonths: number
}

export async function getRevenueForecastData(orgId: string): Promise<RevenueForecastData> {
  const now = new Date()
  const twelveMonthsAgo = new Date(now)
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { currency: true },
  })
  const orgCurrency = org?.currency ?? "INR"

  // Query 1 — paid invoices last 12 months, filtered to org currency
  // Simplification: only invoices in org's primary currency are summed; cross-currency invoices excluded.
  const paidInvoices = await db.invoice.findMany({
    where: {
      orgId,
      status: "PAID",
      paidAt: { gte: twelveMonthsAgo },
      currency: orgCurrency,
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

  // Query 2 — unpaid/overdue invoices, filtered to org currency
  const openInvoices = await db.invoice.findMany({
    where: {
      orgId,
      status: { in: ["UNPAID", "OVERDUE"] },
      currency: orgCurrency,
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

  const totalPaidLast30Days = paidInvoices
    .filter((i) => i.paidAt && i.paidAt >= thirtyDaysAgo)
    .reduce((s, i) => s + toNum(i.total), 0)

  const totalPaidLast90Days = paidInvoices
    .filter((i) => i.paidAt && i.paidAt >= ninetyDaysAgo)
    .reduce((s, i) => s + toNum(i.total), 0)

  const avgMonthlyRevenue = totalPaidLast90Days / 3

  const totalOutstanding = openInvoices.reduce((s, i) => s + toNum(i.total), 0)
  const overdueInvoices = openInvoices.filter((i) => i.status === "OVERDUE")
  const overdueValue = overdueInvoices.reduce((s, i) => s + toNum(i.total), 0)

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
      allInvoices: { createdAt: Date }[]
    }
  >()

  for (const inv of paidInvoices) {
    const entry = clientMap.get(inv.clientId) ?? {
      clientName: inv.client.name,
      paidInvoices: [] as PaidInv[],
      openInvoices: [] as OpenInv[],
      allInvoices: [] as { createdAt: Date }[],
    }
    entry.paidInvoices.push(inv)
    entry.allInvoices.push({ createdAt: inv.createdAt })
    clientMap.set(inv.clientId, entry)
  }

  for (const inv of openInvoices) {
    const entry = clientMap.get(inv.clientId) ?? {
      clientName: inv.client.name,
      paidInvoices: [] as PaidInv[],
      openInvoices: [] as OpenInv[],
      allInvoices: [] as { createdAt: Date }[],
    }
    entry.openInvoices.push(inv)
    entry.allInvoices.push({ createdAt: inv.createdAt })
    clientMap.set(inv.clientId, entry)
  }

  const clientStats: ClientStat[] = []

  for (const [clientId, data] of clientMap.entries()) {
    const totalBilled =
      data.paidInvoices.reduce((s, i) => s + toNum(i.total), 0) +
      data.openInvoices.reduce((s, i) => s + toNum(i.total), 0)
    const totalPaid = data.paidInvoices.reduce((s, i) => s + toNum(i.total), 0)

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
      totalBilled,
      totalPaid,
      avgDaysToPay,
      lastInvoiceDate,
      invoiceCount: data.paidInvoices.length + data.openInvoices.length,
      hasOpenInvoice: data.openInvoices.length > 0,
    })
  }

  const slowPayers = clientStats
    .filter(
      (c) =>
        c.avgDaysToPay !== null &&
        c.avgDaysToPay > 14 &&
        c.hasOpenInvoice
    )
    .map((c) => ({
      clientName: c.clientName,
      avgDaysToPay: Math.round(c.avgDaysToPay!),
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
      daysSinceLastInvoice: Math.floor(
        (now.getTime() - c.lastInvoiceDate!.getTime()) / 86400000
      ),
    }))

  const dataWindowMonths = paidInvoices.length > 0
    ? Math.ceil(
        (now.getTime() -
          Math.min(...paidInvoices.map((i) => i.createdAt.getTime()))) /
          (30 * 86400000)
      )
    : 0

  return {
    totalPaidLast30Days,
    totalPaidLast90Days,
    avgMonthlyRevenue,
    paidInvoiceCount: paidInvoices.length,
    currency: orgCurrency,
    totalOutstanding,
    overdueCount: overdueInvoices.length,
    overdueValue,
    oldestOverdueDays,
    clientStats,
    slowPayers,
    dormantClients,
    hasSufficientData: paidInvoices.length >= 5,
    dataWindowMonths,
  }
}
