import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { addDays, addMonths, addYears, startOfDay } from "date-fns"

export const maxDuration = 300 // driven by EC2 system crontab, daily

type RecurringCron = "weekly" | "monthly" | "quarterly" | "yearly"

// Returns the start of the current period for a given cron cadence, anchored
// to the parent invoice's issueDate. "Current period" means: the most recent
// period boundary that has already passed as of `now`.
function periodStart(issueDate: Date, cron: RecurringCron, now: Date): Date {
  let boundary = startOfDay(issueDate)
  let next = boundary

  while (next <= now) {
    boundary = next
    switch (cron) {
      case "weekly":    next = addDays(boundary, 7); break
      case "monthly":   next = addMonths(boundary, 1); break
      case "quarterly": next = addMonths(boundary, 3); break
      case "yearly":    next = addYears(boundary, 1); break
    }
  }

  return boundary
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret")
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Fire and forget — don't await
  setImmediate(() => {
    processRecurringInvoices().catch(err =>
      console.error("Recurring invoice cron error:", err)
    )
  })

  return NextResponse.json({ status: "processing", message: "Cron started" })
}

async function processRecurringInvoices() {
  const now = new Date()

  const parents = await db.invoice.findMany({
    where: {
      isRecurring: true,
      recurringCron: { not: null },
      OR: [
        { recurringCron: "weekly",    issueDate: { lte: addDays(now, -7) } },
        { recurringCron: "monthly",   issueDate: { lte: addDays(now, -30) } },
        { recurringCron: "quarterly", issueDate: { lte: addDays(now, -90) } },
        { recurringCron: "yearly",    issueDate: { lte: addDays(now, -365) } },
      ],
    },
    include: { items: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "asc" },
    take: 50,
  })

  let generated = 0
  let skipped = 0
  const errors: string[] = []

  for (const parent of parents) {
    try {
      const cron = parent.recurringCron as RecurringCron
      const start = periodStart(parent.issueDate, cron, now)

      // Skip if we've already generated an invoice for this period
      const existing = await db.invoice.findFirst({
        where: {
          orgId: parent.orgId,
          clientId: parent.clientId,
          recurringCron: cron,
          createdAt: { gte: start },
          id: { not: parent.id },
        },
        select: { id: true },
      })

      if (existing) {
        skipped++
        continue
      }

      // Don't generate if the period hasn't started yet (issueDate is in the future)
      if (start < startOfDay(parent.issueDate)) {
        skipped++
        continue
      }

      // Generate next invoice number for this org
      const orgInvoices = await db.invoice.findMany({
        where: { orgId: parent.orgId },
        select: { invoiceNumber: true },
      })
      const maxNum = orgInvoices.reduce((max, inv) => {
        const m = inv.invoiceNumber.match(/(\d+)$/)
        return m ? Math.max(max, parseInt(m[1], 10)) : max
      }, 0)
      const invoiceNumber = `INV-${String(maxNum + 1).padStart(3, "0")}`

      const issueDate = startOfDay(now)
      const dueDayGap =
        parent.dueDate
          ? Math.round((parent.dueDate.getTime() - parent.issueDate.getTime()) / 86400000)
          : 30
      const dueDate = addDays(issueDate, dueDayGap)

      await db.invoice.create({
        data: {
          orgId: parent.orgId,
          clientId: parent.clientId,
          invoiceNumber,
          status: "UNPAID",
          issueDate,
          dueDate,
          currency: parent.currency,
          fxRate: parent.fxRate,
          subtotal: parent.subtotal,
          taxAmount: parent.taxAmount,
          discountAmount: parent.discountAmount,
          total: parent.total,
          amountPaid: 0,
          amountDue: parent.total,
          notes: parent.notes,
          terms: parent.terms,
          autoFollowUp: parent.autoFollowUp,
          isRecurring: true,
          recurringCron: cron,
          items: {
            create: parent.items.map((item) => ({
              description: item.description,
              hsn: item.hsn,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxRate: item.taxRate,
              taxName: item.taxName,
              taxType: item.taxType,
              taxAmount: item.taxAmount,
              discount: item.discount,
              total: item.total,
              sortOrder: item.sortOrder,
            })),
          },
        },
      })

      generated++
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      errors.push(`Invoice ${parent.id}: ${msg}`)
    }
  }

  const hasMore = parents.length === 50
  console.log("Recurring invoice cron done:", { generated, skipped, errors, total: parents.length, hasMore })
}
