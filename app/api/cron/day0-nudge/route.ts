import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { sendDay0NudgeEmail } from "@/lib/email"

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret")
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const floor = new Date(now.getTime() - 2 * 60 * 60 * 1000)  // 2 hours ago
  const ceiling = new Date(now.getTime() - 3 * 60 * 60 * 1000) // 3 hours ago

  const orgs = await db.organization.findMany({
    where: {
      createdAt: { lte: floor, gte: ceiling },
      day0NudgeSent: false,
      invoices: { none: {} },
    },
    select: {
      id: true,
      orgUsers: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: {
          user: {
            select: { name: true, email: true, emailVerified: true },
          },
        },
      },
    },
  })

  const sent: string[] = []
  const skipped: string[] = []

  for (const org of orgs) {
    const user = org.orgUsers[0]?.user
    if (!user?.emailVerified) {
      skipped.push(org.id)
      continue
    }
    await sendDay0NudgeEmail({ name: user.name ?? "", email: user.email })
    await db.organization.update({
      where: { id: org.id },
      data: { day0NudgeSent: true },
    })
    sent.push(user.email)
  }

  console.log("Day0 nudge cron:", { sent: sent.length, skipped: skipped.length, emails: sent })
  return NextResponse.json({ sent: sent.length, skipped: skipped.length, emails: sent })
}
