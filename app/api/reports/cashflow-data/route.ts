import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { subMonths, startOfMonth, endOfMonth, format, addDays, isWithinInterval } from "date-fns"

export async function GET() {
  const session = await auth()
  if (!session?.user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const orgId = session.user.orgId

  const now = new Date()

  // 12-month payment history
  const paymentHistory = await Promise.all(
    Array.from({ length: 12 }, (_, i) => {
      const d = subMonths(now, 11 - i)
      const start = startOfMonth(d)
      const end = endOfMonth(d)
      return prisma.payment.aggregate({
        where: { invoice: { orgId }, paidAt: { gte: start, lte: end } },
        _sum: { amount: true },
      }).then((r) => ({ month: format(d, "MMM yyyy"), received: Number(r._sum.amount ?? 0) }))
    })
  )

  // Unpaid invoices
  const unpaid = await prisma.invoice.findMany({
    where: { orgId, status: { in: ["UNPAID", "OVERDUE"] } },
    select: { id: true, total: true, dueDate: true, client: { select: { name: true } } },
    orderBy: { dueDate: "asc" },
  })

  // Invoices due in next 7 days
  const nextWeek = addDays(now, 7)
  const dueSoon = unpaid.filter(
    (i) => i.dueDate && isWithinInterval(i.dueDate, { start: now, end: nextWeek })
  )
  const dueSoonTotal = dueSoon.reduce((s, i) => s + Number(i.total), 0)
  const dueSoonCount = dueSoon.length

  // Per-client average days late (paid invoices only)
  const paidInvoices = await prisma.invoice.findMany({
    where: { orgId, status: "PAID", dueDate: { not: null } },
    select: {
      dueDate: true,
      client: { select: { name: true } },
      payments: { select: { paidAt: true }, where: { paidAt: { not: null } }, orderBy: { paidAt: "asc" }, take: 1 },
    },
    orderBy: { issueDate: "desc" },
    take: 200,
  })

  const clientLateness: Record<string, number[]> = {}
  for (const inv of paidInvoices) {
    if (!inv.dueDate || inv.payments.length === 0 || !inv.payments[0].paidAt) continue
    const daysLate = Math.round(
      (inv.payments[0].paidAt.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysLate > 0) {
      const name = inv.client.name
      clientLateness[name] = clientLateness[name] ?? []
      clientLateness[name].push(daysLate)
    }
  }

  const latePayerAlerts = Object.entries(clientLateness)
    .map(([client, days]) => ({
      client,
      avgDaysLate: Math.round(days.reduce((a, b) => a + b, 0) / days.length),
    }))
    .filter((c) => c.avgDaysLate >= 5)
    .sort((a, b) => b.avgDaysLate - a.avgDaysLate)
    .slice(0, 3)

  // Monthly expenses (avg last 3 months)
  const expenseSum = await prisma.expense.aggregate({
    where: { orgId, date: { gte: subMonths(now, 3) } },
    _sum: { amount: true },
  })
  const monthlyExpenses = Number(expenseSum._sum.amount ?? 0) / 3

  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { currency: true } })

  return NextResponse.json({
    currency: org?.currency ?? "INR",
    paymentHistory,
    unpaidInvoices: unpaid.map((i) => ({
      amount: Number(i.total),
      dueDate: i.dueDate ? format(i.dueDate, "d MMM yyyy") : "No due date",
      clientName: i.client.name,
    })),
    monthlyExpenses,
    latePayerAlerts,
    dueSoon: { count: dueSoonCount, total: dueSoonTotal, dueBy: format(nextWeek, "EEEE") },
  })
}
