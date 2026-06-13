import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { processEvent } from "@/lib/collections-worker"

export const maxDuration = 300 // 5 min cap (driven by EC2 system crontab, daily 09:00)

const MAX_ATTEMPTS = 3 // give up on a touch after this many failed sends

export async function GET(req: NextRequest) {
  // Verify cron secret — reject if wrong or missing
  const secret = req.headers.get("x-cron-secret")
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()

  // Fetch due events: PENDING, or FAILED with retries left. Skip paid/draft
  // invoices here so they never eat into the per-run budget.
  const due = await prisma.collectionEvent.findMany({
    where: {
      scheduledAt: { lte: now },
      invoice: { status: { notIn: ["PAID", "DRAFT"] } },
      OR: [
        { status: "PENDING" },
        { status: "FAILED", attempts: { lt: MAX_ATTEMPTS } },
      ],
    },
    include: {
      invoice: {
        include: {
          client: true,
          org: { select: { name: true, email: true } },
        },
      },
    },
    orderBy: { scheduledAt: "asc" },
    take: 200,
  })

  // Burst guard: send at most one reminder per invoice per run. A freshly-sent
  // overdue invoice can have several touches due at once — they trickle out one
  // per daily run instead of arriving together.
  const seenInvoices = new Set<string>()
  const events = due.filter((e) => {
    if (seenInvoices.has(e.invoiceId)) return false
    seenInvoices.add(e.invoiceId)
    return true
  })

  let processed = 0
  let skipped = 0
  const errors: string[] = []

  for (const event of events) {
    try {
      const result = await processEvent(event)
      if (result === "sent") processed++
      else if (result === "skipped") skipped++
      else errors.push(`Event ${event.id}: failed`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      errors.push(`Event ${event.id}: ${msg}`)
      await prisma.collectionEvent.update({
        where: { id: event.id },
        data: { status: "FAILED", errorMsg: msg, attempts: { increment: 1 } },
      })
    }
  }

  return NextResponse.json({ processed, skipped, errors, total: events.length })
}
