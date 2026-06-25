import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { sendDay5ProNudgeEmail } from "@/lib/email"

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret")
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  // Target orgs created between 5 and 6 days ago
  const floor = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
  const ceiling = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)

  const orgs = await db.organization.findMany({
    where: {
      createdAt: { lte: floor, gte: ceiling },
      plan: "free",
      day5ProNudgeSentAt: null,
      invoices: { some: {} },
    },
    select: {
      id: true,
      name: true,
      orgUsers: {
        where: { role: "OWNER", isActive: true },
        select: {
          user: {
            select: { email: true, emailVerified: true },
          },
        },
        take: 1,
      },
    },
  })

  const sent: string[] = []
  const skipped: string[] = []

  for (const org of orgs) {
    const owner = org.orgUsers[0]?.user
    if (!owner?.emailVerified) {
      skipped.push(org.id)
      continue
    }
    await sendDay5ProNudgeEmail(org.name, owner.email)
    await db.organization.update({
      where: { id: org.id },
      data: { day5ProNudgeSentAt: now },
    })
    sent.push(owner.email)
  }

  console.log("Day5 pro nudge cron:", { sent: sent.length, skipped: skipped.length, emails: sent })
  return NextResponse.json({ sent: sent.length, skipped: skipped.length, emails: sent })
}
