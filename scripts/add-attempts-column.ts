/**
 * One-off: add CollectionEvent.attempts (failed-send retry counter).
 * Additive + idempotent. Targets the same DB the app uses (.env.local DATABASE_URL).
 *   tsx scripts/add-attempts-column.ts
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
  await pool.query(
    'ALTER TABLE "CollectionEvent" ADD COLUMN IF NOT EXISTS "attempts" INTEGER NOT NULL DEFAULT 0;'
  )
  const { rows } = await pool.query(
    `SELECT column_name, data_type, column_default
       FROM information_schema.columns
      WHERE table_name = 'CollectionEvent' AND column_name = 'attempts';`
  )
  console.log("attempts column:", rows)
  await pool.end()
}

main().then(() => console.log("done")).catch((e) => {
  console.error("FAILED:", e instanceof Error ? e.message : e)
  process.exit(1)
})
