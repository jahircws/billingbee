import { NextRequest, NextResponse } from "next/server"
import { getMobileSession } from "@/lib/mobile-auth"
import db from "@/lib/db"
import { startOfMonth, endOfMonth } from "date-fns"

export async function GET(req: NextRequest) {
  try {
    const session = await getMobileSession(req)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { orgId } = session

    const org = await db.organization.findUnique({
      where: { id: orgId },
      select: { currency: true, country: true },
    })
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    const [outstandingAgg, paidThisMonthAgg, totalClients, recentInvoices] = await Promise.all([
      db.invoice.aggregate({
        where: { orgId, status: { in: ["UNPAID", "OVERDUE"] }, currency: org.currency },
        _sum: { amountDue: true },
      }),
      db.payment.aggregate({
        where: { orgId, currency: org.currency, paidAt: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
      db.client.count({ where: { orgId } }),
      db.invoice.findMany({
        where: { orgId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          invoiceNumber: true,
          amountDue: true,
          currency: true,
          status: true,
          dueDate: true,
          createdAt: true,
          client: { select: { name: true } },
        },
      }),
    ])

    return NextResponse.json({
      stats: {
        outstanding: Number(outstandingAgg._sum.amountDue ?? 0),
        paidThisMonth: Number(paidThisMonthAgg._sum.amount ?? 0),
        totalClients,
      },
      recentInvoices: recentInvoices.map((inv) => ({
        id: inv.id,
        number: inv.invoiceNumber,
        clientName: inv.client.name,
        amount: Number(inv.amountDue),
        currency: inv.currency,
        status: inv.status,
        dueDate: inv.dueDate,
      })),
      currency: org.currency,
      country: org.country,
    })
  } catch (err) {
    console.error("[mobile/dashboard]", err)
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 })
  }
}
