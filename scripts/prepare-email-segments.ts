/**
 * BillingBee v2.0 — Relaunch Email Segment Preparation
 *
 * Reads user data from the OLD database and generates 3 CSV files
 * for the relaunch email campaign. Does NOT send any emails.
 *
 * Output files (written to scripts/email-segments/):
 *   segment-a.csv  — 695 verified users (3 months Pro free)
 *   segment-b.csv  — ~4,230 auto-deactivated / long-inactive users (60 days Pro free)
 *   segment-c.csv  — ~3,899 unverified / never-activated users (cold re-engagement)
 *
 * Usage:
 *   npx ts-node --project tsconfig.scripts.json scripts/prepare-email-segments.ts
 *
 * Required env vars:
 *   OLD_DATABASE_URL — read-only connection to old Postgres database
 *
 * Safety:
 *   - Read-only. No writes to any database.
 *   - Generates CSVs only. Upload to Resend Broadcasts or email provider manually.
 *   - Always review segment-a.csv before uploading (contains personal data).
 */

import { PrismaClient } from "../lib/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import fs from "fs"
import path from "path"

// ── Env ────────────────────────────────────────────────────────────────────────

const OLD_DB_URL = process.env.OLD_DATABASE_URL
if (!OLD_DB_URL) {
  console.error("❌  OLD_DATABASE_URL is not set")
  process.exit(1)
}

// ── DB (read-only via raw SQL) ─────────────────────────────────────────────────

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: OLD_DB_URL }),
})

// ── Types ──────────────────────────────────────────────────────────────────────

interface OldUser {
  id: string
  email: string
  name: string | null
  email_verified: Date | null
  last_active_at: Date | null
  created_at: Date
  plan: string | null
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Extract first name from full name, fall back to email prefix */
function firstName(name: string | null, email: string): string {
  if (name) {
    const first = name.trim().split(/\s+/)[0]
    if (first.length > 0) return capitalize(first)
  }
  // Derive from email: john.doe@... → John
  const prefix = email.split("@")[0].split(/[._-]/)[0]
  return capitalize(prefix)
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

/** Escape a value for CSV (RFC 4180) */
function csvVal(v: string): string {
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`
  }
  return v
}

function csvRow(fields: string[]): string {
  return fields.map(csvVal).join(",")
}

/** Determine if user was auto-deactivated (inactive > 6 months, email verified) */
function isAutoDeactivated(user: OldUser): boolean {
  if (!user.email_verified) return false
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - 6)
  const lastActive = user.last_active_at ?? user.created_at
  return lastActive < cutoff
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🔵  BillingBee — Relaunch Email Segment Preparation")
  console.log("   Read-only. No emails will be sent.\n")

  // ── Fetch all users ──────────────────────────────────────────────────────────

  console.log("📦  Fetching users from old database…")
  const allUsers = await db.$queryRawUnsafe<OldUser[]>(`
    SELECT
      id,
      email,
      name,
      email_verified,
      last_active_at,
      created_at,
      plan
    FROM users
    ORDER BY created_at ASC
  `)
  console.log(`   Total users: ${allUsers.length.toLocaleString()}\n`)

  // ── Segment A: Verified, recently active ────────────────────────────────────
  // Definition: email_verified IS NOT NULL AND (last_active_at within 6 months OR no last_active_at)

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const segmentA = allUsers.filter((u) => {
    if (!u.email_verified) return false
    const lastActive = u.last_active_at ?? u.created_at
    return lastActive >= sixMonthsAgo
  })

  // ── Segment B: Verified but inactive > 6 months ──────────────────────────────

  const segmentB = allUsers.filter((u) => {
    if (!u.email_verified) return false
    const lastActive = u.last_active_at ?? u.created_at
    return lastActive < sixMonthsAgo
  })

  // ── Segment C: Never verified (email_verified IS NULL) ───────────────────────

  const segmentC = allUsers.filter((u) => !u.email_verified)

  // ── Report ────────────────────────────────────────────────────────────────────

  console.log("📊  Segment breakdown:")
  console.log(`   Segment A (verified, active):       ${segmentA.length.toLocaleString()} users`)
  console.log(`   Segment B (verified, inactive >6m): ${segmentB.length.toLocaleString()} users`)
  console.log(`   Segment C (never verified):         ${segmentC.length.toLocaleString()} users`)
  console.log(`   ─────────────────────────────────────────────────────────`)
  console.log(`   Total accounted for:                ${(segmentA.length + segmentB.length + segmentC.length).toLocaleString()} / ${allUsers.length.toLocaleString()}\n`)

  // Warn if totals don't add up
  if (segmentA.length + segmentB.length + segmentC.length !== allUsers.length) {
    console.warn("⚠️   WARNING: Segment totals don't match total users. Check filter logic.")
  }

  // ── Write CSVs ────────────────────────────────────────────────────────────────

  const outDir = path.join(__dirname, "email-segments")
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
    console.log(`   Created output directory: ${outDir}`)
  }

  // Segment A CSV: email, firstName, plan (for merge tags)
  const segAPath = path.join(outDir, "segment-a.csv")
  const segALines = [
    csvRow(["email", "firstName", "plan", "loginUrl"]),
    ...segmentA.map((u) =>
      csvRow([
        u.email,
        firstName(u.name, u.email),
        u.plan ?? "free",
        `https://billingbee.co/login?email=${encodeURIComponent(u.email)}&utm_source=relaunch&utm_campaign=segment-a&utm_medium=email`,
      ])
    ),
  ]
  fs.writeFileSync(segAPath, segALines.join("\n"), "utf-8")
  console.log(`✅  Segment A: ${path.relative(process.cwd(), segAPath)} (${segmentA.length} rows)`)

  // Segment B CSV: email, firstName
  const segBPath = path.join(outDir, "segment-b.csv")
  const segBLines = [
    csvRow(["email", "firstName", "reactivateUrl"]),
    ...segmentB.map((u) =>
      csvRow([
        u.email,
        firstName(u.name, u.email),
        `https://billingbee.co/login?email=${encodeURIComponent(u.email)}&utm_source=relaunch&utm_campaign=segment-b&utm_medium=email`,
      ])
    ),
  ]
  fs.writeFileSync(segBPath, segBLines.join("\n"), "utf-8")
  console.log(`✅  Segment B: ${path.relative(process.cwd(), segBPath)} (${segmentB.length} rows)`)

  // Segment C CSV: email only (no first name — never gave us their details)
  const segCPath = path.join(outDir, "segment-c.csv")
  const segCLines = [
    csvRow(["email", "generateUrl"]),
    ...segmentC.map((u) =>
      csvRow([
        u.email,
        `https://billingbee.co/generate?utm_source=relaunch&utm_campaign=segment-c&utm_medium=email`,
      ])
    ),
  ]
  fs.writeFileSync(segCPath, segCLines.join("\n"), "utf-8")
  console.log(`✅  Segment C: ${path.relative(process.cwd(), segCPath)} (${segmentC.length} rows)\n`)

  // ── Dedup check ────────────────────────────────────────────────────────────────

  const allEmails = [
    ...segmentA.map((u) => u.email),
    ...segmentB.map((u) => u.email),
    ...segmentC.map((u) => u.email),
  ]
  const unique = new Set(allEmails)
  if (unique.size !== allEmails.length) {
    const dupes = allEmails.length - unique.size
    console.warn(`⚠️   WARNING: ${dupes} duplicate email(s) found across segments. Review before sending.`)
  } else {
    console.log(`✅  No duplicate emails across segments.`)
  }

  // ── Summary ────────────────────────────────────────────────────────────────────

  console.log(`\n${"─".repeat(60)}`)
  console.log(`📬  Ready to upload to Resend Broadcasts (or email provider)`)
  console.log(`\n   Next steps:`)
  console.log(`   1. Review CSVs in scripts/email-segments/`)
  console.log(`   2. Upload segment-a.csv → Resend Broadcasts (or similar)`)
  console.log(`   3. Run test send first: npx ts-node scripts/send-test-emails.ts`)
  console.log(`   4. ONLY send after reviewing test emails and confirming links work`)
  console.log(`   5. DO NOT send all 3 segments on the same day`)
  console.log(`      ─ Day 1: Segment A (695 — highest trust, lowest risk)`)
  console.log(`      ─ Day 2: Segment B (4,230 — re-engagement)`)
  console.log(`      ─ Day 3: Segment C (3,899 — cold, no relationship)`)
  console.log(`${"─".repeat(60)}\n`)

  await db.$disconnect()
}

main().catch((e) => {
  console.error("Fatal error:", e)
  process.exit(1)
})
