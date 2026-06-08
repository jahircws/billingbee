/**
 * BillingBee v2.0 — Data Migration Script
 *
 * Migrates verified users + their data from the old system into BillingBee v2.
 *
 * ALWAYS run migrate:dry first. Fix any errors. Then run migrate:run.
 *
 * Usage:
 *   npm run migrate:dry   ← dry run, writes nothing to DB
 *   npm run migrate:run   ← live run, commits all changes
 *
 * Required env vars:
 *   OLD_DATABASE_URL — connection string for the old read-only database
 *   DATABASE_URL     — connection string for the new BillingBee v2 database
 */

import { PrismaClient as NewPrisma } from "../lib/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { hash } from "bcryptjs"
import { addDays } from "date-fns"
import fs from "fs"
import path from "path"

// ── Env validation ────────────────────────────────────────────────────────────

const OLD_DB_URL = process.env.OLD_DATABASE_URL
const NEW_DB_URL = process.env.DATABASE_URL

if (!OLD_DB_URL) {
  console.error("ERROR: OLD_DATABASE_URL is not set")
  process.exit(1)
}
if (!NEW_DB_URL) {
  console.error("ERROR: DATABASE_URL is not set")
  process.exit(1)
}

const DRY_RUN = process.argv.includes("--dry-run")

// ── Prisma clients ────────────────────────────────────────────────────────────

// New schema client (write target)
const newDb = new NewPrisma({
  adapter: new PrismaPg({ connectionString: NEW_DB_URL }),
  log: DRY_RUN ? [] : ["warn", "error"],
})

// Old DB — raw SQL only via $queryRawUnsafe.
// We reuse NewPrisma pointed at the old URL; only $queryRawUnsafe calls are made
// so schema mismatch doesn't matter. Old DB must be Postgres.
const oldDb = new NewPrisma({
  adapter: new PrismaPg({ connectionString: OLD_DB_URL }),
  log: [],
})

// ── Old schema types (what we expect to read) ─────────────────────────────────

interface OldUser {
  id: string
  email: string
  email_verified: Date | null
  business_name: string | null
  name: string | null
  created_at: Date
}

interface OldClient {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  gstin: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  created_at: Date
}

interface OldInvoice {
  id: string
  user_id: string
  client_id: string
  invoice_number: string
  status: string
  issue_date: Date
  due_date: Date | null
  currency: string
  subtotal: number
  tax_amount: number
  discount_amount: number
  total: number
  amount_paid: number
  amount_due: number
  notes: string | null
  created_at: Date
}

interface OldInvoiceItem {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  tax_rate: number
  tax_amount: number
  total: number
  sort_order: number
}

// ── Default seed data ─────────────────────────────────────────────────────────

const DEFAULT_TAXES = [
  { name: "GST 18%", rate: 18, isDefault: true },
  { name: "GST 12%", rate: 12, isDefault: false },
  { name: "GST 5%", rate: 5, isDefault: false },
  { name: "No Tax", rate: 0, isDefault: false },
]

const DEFAULT_CATEGORIES = [
  { name: "Services", color: "#059669" },
  { name: "Products", color: "#3b82f6" },
  { name: "Consulting", color: "#8b5cf6" },
  { name: "Expenses", color: "#f59e0b" },
]

// ── Status mapping ────────────────────────────────────────────────────────────

function mapInvoiceStatus(old: string): "DRAFT" | "UNPAID" | "PAID" | "OVERDUE" {
  const s = old.toUpperCase()
  if (s === "PAID") return "PAID"
  if (s === "OVERDUE") return "OVERDUE"
  if (s === "DRAFT") return "DRAFT"
  return "UNPAID"
}

function mapCurrency(old: string): "INR" | "USD" | "EUR" | "GBP" | "AUD" | "CAD" | "SGD" | "AED" {
  const c = old.toUpperCase()
  const valid = ["INR", "USD", "EUR", "GBP", "AUD", "CAD", "SGD", "AED"]
  return valid.includes(c) ? (c as ReturnType<typeof mapCurrency>) : "INR"
}

// ── Logging ───────────────────────────────────────────────────────────────────

const BOLD = "\x1b[1m"
const GREEN = "\x1b[32m"
const YELLOW = "\x1b[33m"
const RED = "\x1b[31m"
const CYAN = "\x1b[36m"
const RESET = "\x1b[0m"

function log(msg: string) { console.log(msg) }
function info(msg: string) { console.log(`${CYAN}  ${msg}${RESET}`) }
function ok(msg: string) { console.log(`${GREEN}  ✓ ${msg}${RESET}`) }
function warn(msg: string) { console.log(`${YELLOW}  ⚠ ${msg}${RESET}`) }
function err(msg: string) { console.error(`${RED}  ✗ ${msg}${RESET}`) }

// ── Fetch old data (read-only) ────────────────────────────────────────────────

async function fetchOldData() {
  log(`\n${BOLD}Connecting to OLD database…${RESET}`)

  const oldUsers: OldUser[] = await oldDb.$queryRawUnsafe(`
    SELECT id, email, email_verified, business_name, name, created_at
    FROM users
    ORDER BY created_at ASC
  `)

  const verifiedUsers = oldUsers.filter((u) => u.email_verified !== null)
  const unverifiedUsers = oldUsers.filter((u) => u.email_verified === null)

  info(`Total users in old DB:      ${oldUsers.length}`)
  info(`Verified (to migrate):      ${verifiedUsers.length}`)
  info(`Unverified (CSV export):    ${unverifiedUsers.length}`)

  const verifiedIds = verifiedUsers.map((u) => `'${u.id}'`).join(",")

  const oldClients: OldClient[] = verifiedIds.length
    ? await oldDb.$queryRawUnsafe(`
        SELECT * FROM clients
        WHERE user_id IN (${verifiedIds})
        ORDER BY created_at ASC
      `)
    : []

  const oldInvoices: OldInvoice[] = verifiedIds.length
    ? await oldDb.$queryRawUnsafe(`
        SELECT * FROM invoices
        WHERE user_id IN (${verifiedIds})
        ORDER BY created_at ASC
      `)
    : []

  const invoiceIds = oldInvoices.map((i) => `'${i.id}'`).join(",")
  const oldItems: OldInvoiceItem[] = invoiceIds.length
    ? await oldDb.$queryRawUnsafe(`
        SELECT * FROM invoice_items
        WHERE invoice_id IN (${invoiceIds})
        ORDER BY sort_order ASC
      `)
    : []

  info(`Clients to migrate:         ${oldClients.length}`)
  info(`Invoices to migrate:        ${oldInvoices.length}`)
  info(`Invoice items to migrate:   ${oldItems.length}`)

  return { verifiedUsers, unverifiedUsers, oldClients, oldInvoices, oldItems }
}

// ── Pre-migration verification ────────────────────────────────────────────────

async function verifyBefore(
  verifiedUsers: OldUser[],
  oldClients: OldClient[],
  oldInvoices: OldInvoice[],
) {
  log(`\n${BOLD}Pre-migration verification${RESET}`)

  const [existingOrgs, existingClients, existingInvoices] = await Promise.all([
    newDb.organization.count(),
    newDb.client.count(),
    newDb.invoice.count(),
  ])

  info(`New DB orgs before:     ${existingOrgs}`)
  info(`New DB clients before:  ${existingClients}`)
  info(`New DB invoices before: ${existingInvoices}`)

  // Check for email collisions
  const emails = verifiedUsers.map((u) => u.email)
  const existingUsers = await newDb.user.findMany({
    where: { email: { in: emails } },
    select: { email: true },
  })

  if (existingUsers.length > 0) {
    warn(`${existingUsers.length} emails already exist in new DB — will skip:`)
    existingUsers.forEach((u: { email: string }) => info(`  - ${u.email}`))
  }

  return {
    existingOrgs,
    existingClients,
    existingInvoices,
    collidingEmails: new Set(existingUsers.map((u: { email: string }) => u.email)),
  }
}

// ── Post-migration verification ───────────────────────────────────────────────

async function verifyAfter(
  expectedNewOrgs: number,
  expectedNewClients: number,
  expectedNewInvoices: number,
  existingOrgs: number,
  existingClients: number,
  existingInvoices: number,
) {
  log(`\n${BOLD}Post-migration verification${RESET}`)

  const [newOrgs, newClients, newInvoices] = await Promise.all([
    newDb.organization.count(),
    newDb.client.count(),
    newDb.invoice.count(),
  ])

  const orgDelta = newOrgs - existingOrgs
  const clientDelta = newClients - existingClients
  const invoiceDelta = newInvoices - existingInvoices

  info(`Orgs created:    ${orgDelta} (expected ${expectedNewOrgs})`)
  info(`Clients created: ${clientDelta} (expected ${expectedNewClients})`)
  info(`Invoices created:${invoiceDelta} (expected ${expectedNewInvoices})`)

  let passed = true

  if (orgDelta !== expectedNewOrgs) {
    err(`Org count mismatch! Created ${orgDelta}, expected ${expectedNewOrgs}`)
    passed = false
  }
  if (clientDelta !== expectedNewClients) {
    err(`Client count mismatch! Created ${clientDelta}, expected ${expectedNewClients}`)
    passed = false
  }
  if (invoiceDelta !== expectedNewInvoices) {
    err(`Invoice count mismatch! Created ${invoiceDelta}, expected ${expectedNewInvoices}`)
    passed = false
  }

  if (!passed) {
    throw new Error("VERIFICATION FAILED — see errors above")
  }

  log(`\n${GREEN}${BOLD}VERIFICATION PASSED ✓${RESET}`)
}

// ── Export unverified emails CSV ──────────────────────────────────────────────

function exportUnverifiedCsv(users: OldUser[]) {
  const filePath = path.resolve(__dirname, "unverified-emails.csv")
  const csv = ["email", ...users.map((u) => u.email)].join("\n")
  if (!DRY_RUN) {
    fs.writeFileSync(filePath, csv, "utf8")
    ok(`Exported ${users.length} unverified emails → ${filePath}`)
  } else {
    info(`[DRY RUN] Would export ${users.length} unverified emails → scripts/unverified-emails.csv`)
  }
}

// ── Migrate a single verified user ───────────────────────────────────────────

async function migrateUser(
  oldUser: OldUser,
  userClients: OldClient[],
  userInvoices: OldInvoice[],
  allItems: OldInvoiceItem[],
  tempPasswordHash: string,
  dryStats: { users: number; clients: number; invoices: number },
) {
  const orgName =
    oldUser.business_name?.trim() ||
    oldUser.email.split("@")[1].replace(/\.[^.]+$/, "") + " Org"

  const orgSlug = orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50) || `org-${Date.now()}`

  const trialEndsAt = addDays(new Date(), 90)

  if (DRY_RUN) {
    info(`[DRY RUN] Would migrate: ${oldUser.email}`)
    info(`          Org: "${orgName}" (${orgSlug})`)
    info(`          Clients: ${userClients.length} | Invoices: ${userInvoices.length}`)
    dryStats.users++
    dryStats.clients += userClients.length
    dryStats.invoices += userInvoices.length
    return
  }

  // Ensure unique slug
  let slug = orgSlug
  let slugAttempt = 1
  while (await newDb.organization.findUnique({ where: { slug } })) {
    slug = `${orgSlug}-${slugAttempt++}`
  }

  // a. Create Organization
  const org = await newDb.organization.create({
    data: {
      name: orgName,
      slug,
      email: oldUser.email,
      plan: "pro",              // pro during trial
      planExpiry: trialEndsAt,  // 90-day trial window
      acquisitionSource: "migration_verified",
      createdAt: oldUser.created_at,
    },
  })

  // b. Create User
  const user = await newDb.user.create({
    data: {
      email: oldUser.email,
      name: oldUser.name ?? oldUser.email.split("@")[0],
      passwordHash: tempPasswordHash,
      emailVerified: oldUser.email_verified,
      createdAt: oldUser.created_at,
    },
  })

  // c. Create OrgUser (OWNER)
  await newDb.orgUser.create({
    data: { orgId: org.id, userId: user.id, role: "OWNER" },
  })

  // d. Seed default Taxes + Categories
  await newDb.tax.createMany({
    data: DEFAULT_TAXES.map((t) => ({ ...t, orgId: org.id })),
  })
  await newDb.category.createMany({
    data: DEFAULT_CATEGORIES.map((c) => ({ ...c, orgId: org.id })),
  })

  // e. Migrate Clients — build old_id → new_id map
  const clientIdMap = new Map<string, string>()
  for (const oldClient of userClients) {
    const newClient = await newDb.client.create({
      data: {
        orgId: org.id,
        name: oldClient.name,
        email: oldClient.email ?? undefined,
        phone: oldClient.phone ?? undefined,
        company: oldClient.company ?? undefined,
        gstin: oldClient.gstin ?? undefined,
        address: oldClient.address ?? undefined,
        city: oldClient.city ?? undefined,
        state: oldClient.state ?? undefined,
        country: oldClient.country ?? "IN",
        createdAt: oldClient.created_at,
      },
    })
    clientIdMap.set(oldClient.id, newClient.id)
  }

  // f. Migrate Invoices
  for (const oldInv of userInvoices) {
    const newClientId = clientIdMap.get(oldInv.client_id)
    if (!newClientId) {
      warn(`  Invoice ${oldInv.invoice_number}: client ${oldInv.client_id} not found — skipping`)
      continue
    }

    const items = allItems.filter((i) => i.invoice_id === oldInv.id)

    // Ensure unique invoice number within org
    let invoiceNumber = oldInv.invoice_number
    const existing = await newDb.invoice.findFirst({
      where: { orgId: org.id, invoiceNumber },
    })
    if (existing) invoiceNumber = `${invoiceNumber}-M`

    await newDb.invoice.create({
      data: {
        orgId: org.id,
        clientId: newClientId,
        invoiceNumber,
        status: mapInvoiceStatus(oldInv.status),
        issueDate: oldInv.issue_date,
        dueDate: oldInv.due_date ?? undefined,
        currency: mapCurrency(oldInv.currency),
        subtotal: oldInv.subtotal,
        taxAmount: oldInv.tax_amount,
        discountAmount: oldInv.discount_amount,
        total: oldInv.total,
        amountPaid: oldInv.amount_paid,
        amountDue: oldInv.amount_due,
        notes: oldInv.notes ?? undefined,
        createdAt: oldInv.created_at,
        items: {
          create: items.map((item, idx) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            taxRate: item.tax_rate,
            taxAmount: item.tax_amount,
            discount: 0,
            total: item.total,
            sortOrder: item.sort_order ?? idx,
          })),
        },
      },
    })
  }

  log(`  Migrated: ${oldUser.email} (${userClients.length} clients, ${userInvoices.length} invoices)`)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  log(`\n${BOLD}══════════════════════════════════════════${RESET}`)
  log(`${BOLD}  BillingBee v2.0 — Data Migration${DRY_RUN ? " [DRY RUN]" : ""}${RESET}`)
  log(`${BOLD}══════════════════════════════════════════${RESET}`)

  if (DRY_RUN) {
    log(`\n${YELLOW}${BOLD}DRY RUN MODE — no changes will be written to the database${RESET}`)
  }

  const { verifiedUsers, unverifiedUsers, oldClients, oldInvoices, oldItems } =
    await fetchOldData()

  const { existingOrgs, existingClients, existingInvoices, collidingEmails } =
    await verifyBefore(verifiedUsers, oldClients, oldInvoices)

  // Filter out already-migrated users
  const usersToMigrate = verifiedUsers.filter((u) => !collidingEmails.has(u.email))

  if (usersToMigrate.length === 0) {
    warn("No users left to migrate (all emails already exist in new DB)")
    return
  }

  // Pre-hash temp password once (save bcrypt cost × N users)
  log(`\n${BOLD}Hashing temporary password…${RESET}`)
  const tempPasswordHash = DRY_RUN ? "HASH_PLACEHOLDER" : await hash("ChangeMe123!", 12)

  // Count expected writes (only for users we're migrating)
  const migratingUserIds = new Set(usersToMigrate.map((u) => u.id))
  const clientsToMigrate = oldClients.filter((c) => migratingUserIds.has(c.user_id))
  const invoicesToMigrate = oldInvoices.filter((i) => migratingUserIds.has(i.user_id))

  log(`\n${BOLD}Migrating ${usersToMigrate.length} verified users…${RESET}`)

  const dryStats = { users: 0, clients: 0, invoices: 0 }
  let successCount = 0
  let errorCount = 0

  for (const oldUser of usersToMigrate) {
    const userClients = oldClients.filter((c) => c.user_id === oldUser.id)
    const userInvoices = oldInvoices.filter((i) => i.user_id === oldUser.id)

    try {
      await migrateUser(oldUser, userClients, userInvoices, oldItems, tempPasswordHash, dryStats)
      successCount++
    } catch (e) {
      err(`Failed to migrate ${oldUser.email}: ${e instanceof Error ? e.message : String(e)}`)
      errorCount++
      // Continue with next user — don't abort the whole migration
    }
  }

  // Export unverified emails CSV
  exportUnverifiedCsv(unverifiedUsers)

  // Summary
  log(`\n${BOLD}Migration summary${RESET}`)
  info(`Success: ${successCount} users`)
  if (errorCount > 0) warn(`Errors:  ${errorCount} users (check logs above)`)

  if (DRY_RUN) {
    log(`\n${YELLOW}${BOLD}DRY RUN COMPLETE — would have migrated:${RESET}`)
    log(`  ${dryStats.users} users`)
    log(`  ${dryStats.clients} clients`)
    log(`  ${dryStats.invoices} invoices`)
    log(`\nRun ${BOLD}npm run migrate:run${RESET} to perform the actual migration.`)
    return
  }

  // Post-migration verification
  await verifyAfter(
    successCount,
    clientsToMigrate.length,
    invoicesToMigrate.length,
    existingOrgs,
    existingClients,
    existingInvoices,
  )
}

main()
  .catch((e) => {
    err(`FATAL: ${e instanceof Error ? e.message : String(e)}`)
    if (e instanceof Error && e.stack) console.error(e.stack)
    process.exit(1)
  })
  .finally(async () => {
    await oldDb.$disconnect()
    await newDb.$disconnect()
  })
