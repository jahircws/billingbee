import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { sendDay14UpgradePushEmail } from "@/lib/email"

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret")
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  // Target orgs created between 14 and 15 days ago
  const floor = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const ceiling = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)

  const orgs = await db.organization.findMany({
    where: {
      createdAt: { lte: floor, gte: ceiling },
      plan: "free",
      day14UpgradePushSentAt: null,
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
    await sendDay14UpgradePushEmail(org.name, owner.email)
    await db.organization.update({
      where: { id: org.id },
      data: { day14UpgradePushSentAt: now },
    })
    sent.push(owner.email)
  }

  console.log("Day14 upgrade push cron:", { sent: sent.length, skipped: skipped.length, emails: sent })
  return NextResponse.json({ sent: sent.length, skipped: skipped.length, emails: sent })
}
