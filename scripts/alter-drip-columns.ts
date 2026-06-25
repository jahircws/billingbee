import { PrismaClient } from "../lib/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
const adapter = new PrismaPg(pool)
const db = new PrismaClient({ adapter })

async function run() {
  await db.$executeRawUnsafe(
    'ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "day5ProNudgeSentAt" TIMESTAMP'
  )
  await db.$executeRawUnsafe(
    'ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "day14UpgradePushSentAt" TIMESTAMP'
  )
  console.log("Columns added successfully")
  await db.$disconnect()
  await pool.end()
}

run().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
