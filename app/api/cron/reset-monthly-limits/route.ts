import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

const CRON_SECRET = "billingbee-cron-2026"

export async function GET(req: NextRequest) {
  if (req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await prisma.organization.updateMany({
    data: {
      proposalsThisMonth: 0,
      quotesThisMonth: 0,
      limitsResetAt: new Date(),
    },
  })

  return NextResponse.json({ success: true, resetAt: new Date().toISOString() })
}
