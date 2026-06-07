import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { processEvent } from "@/lib/collections-worker"

export const maxDuration = 300 // 5 min — Vercel Pro limit

export async function GET(req: NextRequest) {
  // Verify cron secret — reject if wrong or missing
  const secret = req.headers.get("x-cron-secret")
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()

  // Fetch all PENDING events due now, with invoice still unpaid
  const events = await prisma.collectionEvent.findMany({
    where: {
      status: "PENDING",
      scheduledAt: { lte: now },
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
    take: 100, // cap per run to stay within timeout
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
        data: { status: "FAILED", errorMsg: msg },
      })
    }
  }

  return NextResponse.json({ processed, skipped, errors, total: events.length })
}
