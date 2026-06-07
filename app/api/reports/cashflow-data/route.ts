import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns"

export async function GET() {
  const session = await auth()
  if (!session?.user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const orgId = session.user.orgId

  const now = new Date()

  // Payment history: last 6 months
  const paymentHistory = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(now, 5 - i)
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
    select: { total: true, dueDate: true, client: { select: { name: true } } },
    orderBy: { dueDate: "asc" },
    take: 20,
  })

  // Monthly expenses (average of last 3 months)
  const threeMonthsAgo = subMonths(now, 3)
  const expenseSum = await prisma.expense.aggregate({
    where: { orgId, date: { gte: threeMonthsAgo } },
    _sum: { amount: true },
  })
  const monthlyExpenses = Number(expenseSum._sum.amount ?? 0) / 3

  return NextResponse.json({
    paymentHistory,
    unpaidInvoices: unpaid.map((i) => ({
      amount: Number(i.total),
      dueDate: i.dueDate ? format(i.dueDate, "d MMM yyyy") : "No due date",
      clientName: i.client.name,
    })),
    monthlyExpenses,
  })
}
