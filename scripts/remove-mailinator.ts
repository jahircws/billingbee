/**
 * Remove test/throwaway accounts from the migrated database.
 *
 * Deletes users matching the blocklist below, plus any migrated org whose
 * members ALL match the blocklist (org data cascades). Orgs with at least one
 * real user are kept — only the blocked members are removed from them.
 *
 * Usage:
 *   npx tsx scripts/remove-mailinator.ts            ← dry run, prints what would be deleted
 *   npx tsx scripts/remove-mailinator.ts --live     ← actually delete
 */

import { config } from "dotenv"
config()
import { PrismaClient } from "../lib/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

// ── Blocklist ─────────────────────────────────────────────────────────────────

// Any email at these domains is considered a test account.
const BLOCKED_DOMAINS = [
  "mailinator.com",
  // disposable-email providers seen in the old DB
  "gufum.com",
  "doishy.com",
  "wenkuu.com",
  "cidoad.com",
  "frandin.com",
  "notedns.com",
  "mugadget.com",
  "w3fax.com",
  "tsderp.com",
  "ziragold.com",
  "usoplay.com",
  "amankro.com",
  "luravell.com",
  "daikoa.com",
  "lawicon.com",
  "bablace.com",
  "datingel.com",
  "logsmarter.net",
  "muatoc.com",
  "pongpong.org",
  "virgilian.com",
  "feesites.com",
  "jcnorris.com",
  "forkshape.com",
  "ahieh.com",
]

// Exact addresses to remove (internal test accounts etc.)
const BLOCKED_EMAILS = [
  "amittest@cwstechnology.com",
  "bbtest@cwstechnology.com",
  "amitbbtest215@cwstechnology.com",
  "testingdata1@gmail.com",
  "testuser23@gmail.com",
  "test1@gmail.com",
]

// ── Setup ─────────────────────────────────────────────────────────────────────

const LIVE = process.argv.includes("--live")

const PG_URL = process.env.DATABASE_URL?.startsWith("prisma+postgres")
  ? process.env.DIRECT_DATABASE_URL
  : process.env.DATABASE_URL

const db = new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString: PG_URL })) })

const blockedEmailSet = new Set(BLOCKED_EMAILS.map((e) => e.toLowerCase()))

function isBlocked(email: string): boolean {
  const lower = email.toLowerCase()
  if (blockedEmailSet.has(lower)) return true
  const domain = lower.split("@")[1] ?? ""
  return BLOCKED_DOMAINS.includes(domain)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(LIVE ? "LIVE RUN — deleting\n" : "DRY RUN — nothing will be deleted (pass --live to delete)\n")

  const users = await db.user.findMany({
    select: { id: true, email: true },
  })
  const blockedUsers = users.filter((u) => isBlocked(u.email))
  console.log(`Blocked users: ${blockedUsers.length}`)
  for (const u of blockedUsers) console.log(`  - ${u.email}`)

  // Orgs where every member is blocked → delete the whole org with its data
  const orgs = await db.organization.findMany({
    where: { acquisitionSource: "v1_migration" },
    select: {
      id: true,
      name: true,
      orgUsers: { select: { user: { select: { email: true } } } },
    },
  })
  const orgsToDelete = orgs.filter(
    (o) => o.orgUsers.length > 0 && o.orgUsers.every((m) => isBlocked(m.user.email)),
  )
  console.log(`\nOrgs fully owned by blocked users (deleted with all their data): ${orgsToDelete.length}`)
  for (const o of orgsToDelete) console.log(`  - ${o.name}`)

  if (!LIVE) {
    console.log("\nDry run complete. Re-run with --live to delete.")
    return
  }

  const delOrgs = await db.organization.deleteMany({
    where: { id: { in: orgsToDelete.map((o) => o.id) } },
  })
  const delUsers = await db.user.deleteMany({
    where: { id: { in: blockedUsers.map((u) => u.id) } },
  })
  const delEmpty = await db.organization.deleteMany({
    where: { acquisitionSource: "v1_migration", orgUsers: { none: {} } },
  })
  console.log(`\nDeleted: ${delOrgs.count} orgs, ${delUsers.count} users, ${delEmpty.count} empty orgs`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
