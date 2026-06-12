import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { fmtCurrency } from "@/lib/currency"

// Lightweight notifications derived from existing data — no dedicated table.
export async function GET() {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) return NextResponse.json({ notifications: [] }, { status: 401 })

  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

  const [overdue, payments, quotes] = await Promise.all([
    prisma.invoice.findMany({
      where: { orgId, status: "OVERDUE" },
      select: { id: true, invoiceNumber: true, amountDue: true, currency: true, dueDate: true, client: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
    prisma.payment.findMany({
      where: { invoice: { orgId }, paidAt: { gte: since } },
      select: { id: true, amount: true, currency: true, paidAt: true, createdAt: true, invoice: { select: { id: true, invoiceNumber: true, client: { select: { name: true } } } } },
      orderBy: { paidAt: "desc" },
      take: 10,
    }),
    prisma.quote.findMany({
      where: { orgId, status: { in: ["ACCEPTED", "REJECTED"] }, updatedAt: { gte: since } },
      select: { id: true, quoteNumber: true, status: true, updatedAt: true, client: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
  ])

  type Notification = { id: string; type: string; title: string; detail: string; href: string; at: string }
  const notifications: Notification[] = []

  for (const inv of overdue) {
    notifications.push({
      id: `inv-${inv.id}`,
      type: "overdue",
      title: `Invoice ${inv.invoiceNumber} is overdue`,
      detail: `${inv.client.name} · ${fmtCurrency(Number(inv.amountDue), inv.currency)} due`,
      href: `/invoices/${inv.id}`,
      at: (inv.dueDate ?? new Date()).toISOString(),
    })
  }
  for (const p of payments) {
    notifications.push({
      id: `pay-${p.id}`,
      type: "payment",
      title: `Payment received — ${fmtCurrency(Number(p.amount), p.currency)}`,
      detail: `${p.invoice.client.name} · ${p.invoice.invoiceNumber}`,
      href: `/invoices/${p.invoice.id}`,
      at: (p.paidAt ?? p.createdAt).toISOString(),
    })
  }
  for (const q of quotes) {
    notifications.push({
      id: `quote-${q.id}`,
      type: q.status === "ACCEPTED" ? "quote_accepted" : "quote_rejected",
      title: `Quote ${q.quoteNumber} ${q.status === "ACCEPTED" ? "accepted" : "rejected"}`,
      detail: q.client.name,
      href: `/quotes/${q.id}`,
      at: q.updatedAt.toISOString(),
    })
  }

  notifications.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())

  return NextResponse.json({ notifications: notifications.slice(0, 20) })
}
