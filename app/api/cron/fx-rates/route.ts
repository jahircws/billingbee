import { NextRequest, NextResponse } from "next/server"
import { refreshDailyRates } from "@/lib/fx"

export const maxDuration = 60 // single outbound fetch + a handful of upserts (EC2 crontab, daily)

export async function GET(req: NextRequest) {
  // Verify cron secret — reject if wrong or missing
  const secret = req.headers.get("x-cron-secret")
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const written = await refreshDailyRates()
    return NextResponse.json({ ok: true, written })
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error"
    console.error("[cron/fx-rates] failed:", message)
    return NextResponse.json({ ok: false, error: message }, { status: 502 })
  }
}
