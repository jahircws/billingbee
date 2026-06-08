import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { addDays } from "date-fns"
import { sendTrialExpiryEmail } from "@/lib/email"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  // Verify cron secret
  const secret = req.headers.get("authorization")?.replace("Bearer ", "")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const in7Days = addDays(now, 7)

  // Orgs on pro trial expiring in next 24h window around 7-day mark
  const orgs = await prisma.organization.findMany({
    where: {
      plan: "pro",
      planExpiry: {
        gte: in7Days,
        lte: addDays(in7Days, 1),
      },
    },
    include: {
      orgUsers: {
        where: { role: "OWNER" },
        include: { user: { select: { email: true } } },
        take: 1,
      },
    },
  })

  const results: { org: string; sent: boolean }[] = []

  for (const org of orgs) {
    const ownerEmail = org.orgUsers[0]?.user?.email
    if (!ownerEmail || !org.planExpiry) continue

    const daysLeft = Math.max(0, Math.ceil((org.planExpiry.getTime() - now.getTime()) / 86400000))
    const checkoutUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? "https://billingbee.co"}/settings?tab=plan`

    try {
      await sendTrialExpiryEmail(org.name, ownerEmail, daysLeft, checkoutUrl)
      results.push({ org: org.name, sent: true })
    } catch {
      results.push({ org: org.name, sent: false })
    }
  }

  return NextResponse.json({ checked: orgs.length, results })
}
