"use server"

import prisma from "@/lib/db"
import { addDays } from "date-fns"

// Day offsets and tones for the 6-touch collection sequence
const COLLECTION_SCHEDULE = [
  { dayNumber: 1,  tone: "FRIENDLY"  as const },
  { dayNumber: 7,  tone: "REMINDER"  as const },
  { dayNumber: 15, tone: "FIRM"      as const },
  { dayNumber: 30, tone: "FIRM"      as const },
  { dayNumber: 45, tone: "ESCALATE"  as const },
  { dayNumber: 90, tone: "ESCALATE"  as const },
]

export async function scheduleCollections(orgId: string, invoiceId: string, dueDate: Date) {
  const events = COLLECTION_SCHEDULE.map(({ dayNumber, tone }) => ({
    orgId,
    invoiceId,
    dayNumber,
    tone,
    scheduledAt: addDays(dueDate, dayNumber),
    status: "PENDING" as const,
  }))

  await prisma.collectionEvent.createMany({ data: events, skipDuplicates: true })
}

// Cancel any pending touches and lay down a fresh sequence anchored to the
// current due date. Used when the due date or autoFollowUp flag changes on an
// edit, so the schedule never goes stale. Already-sent touches are left intact.
export async function rescheduleCollections(orgId: string, invoiceId: string, dueDate: Date) {
  await cancelCollections(orgId, invoiceId)
  await scheduleCollections(orgId, invoiceId, dueDate)
}

export async function cancelCollections(orgId: string, invoiceId: string) {
  await prisma.collectionEvent.updateMany({
    where: { orgId, invoiceId, status: "PENDING" },
    data: { status: "CANCELLED" },
  })
}

export async function pauseCollections(orgId: string, invoiceId: string, days = 7) {
  const events = await prisma.collectionEvent.findMany({
    where: { orgId, invoiceId, status: "PENDING" },
  })

  await Promise.all(
    events.map((e) =>
      prisma.collectionEvent.update({
        where: { id: e.id },
        data: { scheduledAt: addDays(e.scheduledAt, days) },
      })
    )
  )
}

export async function sendCollectionNow(orgId: string, eventId: string) {
  // Pull event and validate ownership
  const event = await prisma.collectionEvent.findUnique({
    where: { id: eventId },
    include: {
      invoice: {
        include: {
          client: true,
          org: { select: { name: true, email: true } },
        },
      },
    },
  })

  if (!event || event.orgId !== orgId) throw new Error("Event not found")
  if (event.status !== "PENDING") throw new Error("Event already processed")

  // Delegate to cron worker logic re-used inline
  const { processEvent } = await import("@/lib/collections-worker")
  await processEvent(event)
}
