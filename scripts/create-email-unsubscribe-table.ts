/**
 * One-off: create EmailUnsubscribe table for SES compliance.
 * Idempotent (CREATE TABLE IF NOT EXISTS).
 *   tsx scripts/create-email-unsubscribe-table.ts
 */
import { config } from "dotenv"
config({ path: ".env.local" })

import { Pool } from "pg"

async function main() {
  const url = process.env.DATABASE_URL ?? process.env.DIRECT_DATABASE_URL
  if (!url || !url.startsWith("postgres")) {
    throw new Error(`Need a plain postgres:// URL; got: ${url?.slice(0, 16)}…`)
  }

  const pool = new Pool({ connectionString: url })
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "EmailUnsubscribe" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "EmailUnsubscribe_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "EmailUnsubscribe_email_key" UNIQUE ("email")
      )
    `)
    console.log("✅ EmailUnsubscribe table ready")
  } finally {
    await pool.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
