import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { sendActivationDripEmail } from "@/lib/email"

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret")
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const floor = new Date(now.getTime() - 20 * 60 * 60 * 1000) // 20 hours ago
  const ceiling = new Date(now.getTime() - 48 * 60 * 60 * 1000) // 48 hours ago

  const users = await db.user.findMany({
    where: {
      createdAt: { lte: floor, gte: ceiling },
      orgUsers: {
        some: {
          org: {
            invoices: { none: {} },
          },
        },
      },
    },
    select: { name: true, email: true },
  })

  for (const user of users) {
    void sendActivationDripEmail({ name: user.name ?? "", email: user.email })
  }

  console.log("Activation drip cron:", { sent: users.length, users: users.map((u) => u.email) })
  return NextResponse.json({ sent: users.length, users: users.map((u) => u.email) })
}
