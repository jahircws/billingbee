import { NextResponse } from "next/server"
import prisma from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const start = Date.now()

  let dbStatus = "ok"
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch {
    dbStatus = "error"
  }

  const ok = dbStatus === "ok"
  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      db: dbStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "0.1.0",
      latencyMs: Date.now() - start,
    },
    { status: ok ? 200 : 503 }
  )
}
