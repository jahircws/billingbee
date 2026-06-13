/**
 * Fix "Unnamed Client" records by pulling first_name + last_name from the
 * linked user via tenant_wise_clients. Falls back to address/city if no user name.
 *
 * Usage:
 *   npx tsx scripts/fix-unnamed-clients.ts --dry-run
 *   npx tsx scripts/fix-unnamed-clients.ts
 */
import { config } from "dotenv"
config({ path: ".env.local", override: true })

import mysql, { RowDataPacket } from "mysql2/promise"
import { PrismaClient } from "../lib/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import fs from "fs"

const DRY_RUN = process.argv.includes("--dry-run")
const PG_URL = process.env.DATABASE_URL
const newDb = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: PG_URL, ssl: { rejectUnauthorized: false } })),
  log: [],
})

const G = "\x1b[32m", Y = "\x1b[33m", C = "\x1b[36m", B = "\x1b[1m", X = "\x1b[0m"

const stats = { updated: 0, fallback_address: 0, no_name: 0, skipped: 0 }

async function main() {
  console.log(`\n${B}Fix Unnamed Clients${DRY_RUN ? " [DRY RUN]" : ""}${X}\n`)

  const conn = await mysql.createConnection({
    uri: process.env.OLD_MYSQL_URL!,
    ssl: { ca: fs.readFileSync("global-bundle.pem") },
  })

  // All clients with no company_name, joined to user name via tenant_wise_clients
  const [rows] = await conn.query<RowDataPacket[]>(`
    SELECT
      c.id            AS client_id,
      c.tenant_id,
      c.street_address,
      c.address,
      c.city_id,
      u.first_name,
      u.last_name
    FROM clients c
    LEFT JOIN tenant_wise_clients twc ON twc.client_id = c.id AND twc.tenant_id = c.tenant_id
    LEFT JOIN users u ON u.id = twc.user_id
    WHERE c.company_name IS NULL OR TRIM(c.company_name) = '' OR c.company_name = 'null'
    ORDER BY c.tenant_id, c.id
  `)

  console.log(`${C}Found ${rows.length} unnamed clients to process${X}`)

  // Build org lookup: tenant email → org id
  const tenantEmails = new Map<string, string>()
  for (const r of rows) {
    if (!tenantEmails.has(r.tenant_id)) {
      const [ue] = await conn.query<RowDataPacket[]>(
        "SELECT email FROM users WHERE tenant_id = ? ORDER BY created_at ASC LIMIT 1", [r.tenant_id]
      )
      if (ue.length && ue[0].email) tenantEmails.set(r.tenant_id, (ue[0].email as string).trim().toLowerCase())
    }
  }

  // Cache org ids by email
  const orgByEmail = new Map<string, string>()
  for (const [, email] of tenantEmails) {
    if (orgByEmail.has(email)) continue
    const org = await newDb.organization.findFirst({
      where: { email, acquisitionSource: "v1_migration" },
      select: { id: true },
    })
    if (org) orgByEmail.set(email, org.id)
  }

  for (const r of rows) {
    const email = tenantEmails.get(r.tenant_id)
    if (!email) { stats.skipped++; continue }
    const orgId = orgByEmail.get(email)
    if (!orgId) { stats.skipped++; continue }

    // Determine best name
    const userName = [r.first_name, r.last_name].filter(Boolean).join(" ").trim()
    const addressName = (r.street_address || r.address)
      ? `Client – ${(r.street_address || r.address).slice(0, 40).trim()}`
      : null

    const newName = userName || addressName

    if (!newName) {
      stats.no_name++
      continue
    }

    // Find the "Unnamed Client" record in new DB that corresponds to this old client
    // Match by orgId — find the client in this org named "Unnamed Client"
    // that was created from the same position (we use address as tiebreaker)
    const candidates = await newDb.client.findMany({
      where: { orgId, name: "Unnamed Client" },
      select: { id: true, address: true },
    })

    let targetId: string | null = null
    if (candidates.length === 1) {
      targetId = candidates[0].id
    } else if (candidates.length > 1) {
      // Match by address if available
      const addr = (r.street_address || r.address || "").trim()
      const match = addr
        ? candidates.find(c => c.address && c.address.trim() === addr)
        : null
      targetId = match?.id ?? null
    }

    if (!targetId) {
      stats.skipped++
      continue
    }

    if (DRY_RUN) {
      console.log(`${C}  [DRY RUN] ${email}: "Unnamed Client" → "${newName}"${X}`)
      stats.updated++
      if (!userName) stats.fallback_address++
      continue
    }

    await newDb.client.update({
      where: { id: targetId },
      data: { name: newName },
    })

    console.log(`${G}  ✓ ${email}: "Unnamed Client" → "${newName}"${X}`)
    stats.updated++
    if (!userName) stats.fallback_address++
  }

  console.log(`\n${B}Summary${X}`)
  console.log(`  Updated:          ${stats.updated}`)
  console.log(`  Address fallback: ${stats.fallback_address}`)
  console.log(`  No name found:    ${stats.no_name}`)
  console.log(`  Skipped:          ${stats.skipped}`)
  if (DRY_RUN) console.log(`\n${Y}DRY RUN — nothing written${X}`)

  await conn.end()
  await newDb.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
