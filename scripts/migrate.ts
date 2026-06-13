/**
 * BillingBee v1 → v2 Migration Script
 *
 * Old DB: MySQL (Laravel multi-tenant)
 * New DB: PostgreSQL (Prisma/Next.js)
 *
 * ALWAYS run dry first. Fix any warnings. Then run live.
 *
 * Usage:
 *   npm run migrate:dry   ← dry run, reads old DB, writes nothing
 *   npm run migrate:run   ← live run, writes to new DB
 *
 * Required env vars:
 *   OLD_MYSQL_URL  — mysql://user:pass@host:3306/dbname  (read-only access is fine)
 *   DATABASE_URL   — postgresql://... (new BillingBee v2 DB)
 */

import { config } from "dotenv"
config({ path: ".env.local", override: true })
config()

import mysql, { RowDataPacket } from "mysql2/promise"
import { PrismaClient, Currency, InvoiceStatus, PaymentMethod } from "../lib/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import fs from "fs"
import path from "path"

// ── Env ────────────────────────────────────────────────────────────────────────

const OLD_MYSQL_URL = process.env.OLD_MYSQL_URL
const DRY_RUN = process.argv.includes("--dry-run")

if (!OLD_MYSQL_URL) {
  console.error("ERROR: OLD_MYSQL_URL is not set. Format: mysql://user:pass@host:3306/dbname")
  process.exit(1)
}
if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set")
  process.exit(1)
}

// pg driver can't speak prisma+postgres:// (local Prisma dev server proxy) —
// fall back to DIRECT_DATABASE_URL which is a plain postgres:// URL.
const PG_URL = process.env.DATABASE_URL?.startsWith("prisma+postgres")
  ? process.env.DIRECT_DATABASE_URL
  : process.env.DATABASE_URL

if (!PG_URL) {
  console.error("ERROR: need a plain postgres:// URL (DATABASE_URL or DIRECT_DATABASE_URL)")
  process.exit(1)
}

const newDb = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: PG_URL, ssl: { rejectUnauthorized: false } })),
  log: DRY_RUN ? [] : ["warn", "error"],
})

// ── Enum maps ─────────────────────────────────────────────────────────────────

// Old invoice.status int values (confirmed by dev):
// 0=DRAFT, 1=UNPAID, 2=PAID, 3=PARTIALLY(→UNPAID), 4=OVERDUE
const INVOICE_STATUS: Record<number, InvoiceStatus> = {
  0: "DRAFT",
  1: "UNPAID",
  2: "PAID",
  3: "UNPAID",  // PARTIALLY PAID → UNPAID; amountPaid/amountDue preserved
  4: "OVERDUE",
}

// Old payments.payment_mode int values (confirmed by dev):
// 1=MANUAL, 2=STRIPE, 3=PAYPAL, 4=CASH, 5=RAZORPAY, 6=CHEQUE, 7=BANKTRANSFER, 8=ONLINE
const PAYMENT_METHOD: Record<number, PaymentMethod> = {
  1: "OTHER",          // MANUAL
  2: "STRIPE",
  3: "PAYPAL",
  4: "CASH",
  5: "RAZORPAY",
  6: "CHEQUE",
  7: "BANK_TRANSFER",
  8: "OTHER",          // ONLINE
}

// Old currencies table id → ISO code (from dump data)
// Currencies not in the new Currency enum are mapped to USD with a warning logged.
const SUPPORTED_CURRENCIES = new Set(["INR","USD","EUR","GBP","AUD","CAD","SGD","AED"])

function mapCurrency(code: string | null | undefined, context: string): Currency {
  if (!code) return "INR"
  const upper = code.toUpperCase()
  if (SUPPORTED_CURRENCIES.has(upper)) return upper as Currency
  warn(`  Currency "${upper}" not supported (${context}) → defaulting to USD`)
  return "USD"
}

function mapInvoiceStatus(status: number): InvoiceStatus {
  return INVOICE_STATUS[status] ?? "UNPAID"
}

function mapPaymentMethod(mode: number): PaymentMethod {
  return PAYMENT_METHOD[mode] ?? "OTHER"
}

// ── Logging ───────────────────────────────────────────────────────────────────

const B = "\x1b[1m", G = "\x1b[32m", Y = "\x1b[33m", R = "\x1b[31m", C = "\x1b[36m", X = "\x1b[0m"
const log  = (m: string) => console.log(m)
const info = (m: string) => console.log(`${C}  ${m}${X}`)
const ok   = (m: string) => console.log(`${G}  ✓ ${m}${X}`)
const warn = (m: string) => console.log(`${Y}  ⚠ ${m}${X}`)
const err  = (m: string) => console.error(`${R}  ✗ ${m}${X}`)

// ── Slug helper ───────────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "org"
}

// ── Text cleanup ──────────────────────────────────────────────────────────────

// Old Laravel app stored HTML-escaped text (&amp; &quot; etc.) — decode it back.
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
}

function cleanText(s: string | null | undefined): string | null {
  if (!s) return null
  const cleaned = decodeEntities(s).trim()
  return cleaned || null
}

// The old app seeded "Your Company Name" / "BillingBee.co" as placeholder
// company names — don't carry those over as real org names.
const PLACEHOLDER_ORG_NAMES = new Set([
  "your company name",
  "your company",
  "billingbee.co",
  "company name",
])

function isPlaceholderName(s: string | null | undefined): boolean {
  return !s || PLACEHOLDER_ORG_NAMES.has(s.trim().toLowerCase())
}

// ── Stats ─────────────────────────────────────────────────────────────────────

const stats = {
  orgs: 0, users: 0, clients: 0,
  invoices: 0, invoiceItems: 0,
  payments: 0, quotes: 0, quoteItems: 0,
  expenses: 0, taxes: 0, skipped: 0,
  currencyFallbacks: 0,
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  log(`\n${B}══════════════════════════════════════════${X}`)
  log(`${B}  BillingBee v1 → v2 Migration${DRY_RUN ? " [DRY RUN]" : ""}${X}`)
  log(`${B}══════════════════════════════════════════${X}`)
  if (DRY_RUN) log(`\n${Y}${B}DRY RUN — no writes will occur${X}`)

  // ── Connect to old MySQL ───────────────────────────────────────────────────
  log(`\n${B}Connecting to old MySQL…${X}`)
  const conn = await mysql.createConnection({
    uri: OLD_MYSQL_URL!,
    ssl: { ca: fs.readFileSync(path.resolve(process.cwd(), "global-bundle.pem")) },
  })
  log("  Connected.")

  // ── Load reference data ────────────────────────────────────────────────────
  log(`\n${B}Loading reference tables…${X}`)

  // currencies: id → ISO code
  const [currRows] = await conn.query<RowDataPacket[]>("SELECT id, code FROM currencies")
  const currencyById = new Map<number, string>()
  for (const r of currRows) currencyById.set(r.id, r.code ?? "INR")

  // settings: group by tenant_id as Map<tenantId, Map<key, value>>
  const [settRows] = await conn.query<RowDataPacket[]>(
    "SELECT tenant_id, `key`, `value` FROM settings WHERE tenant_id IS NOT NULL"
  )
  const settingsByTenant = new Map<string, Map<string, string>>()
  for (const r of settRows) {
    if (!settingsByTenant.has(r.tenant_id)) settingsByTenant.set(r.tenant_id, new Map())
    settingsByTenant.get(r.tenant_id)!.set(r.key, r.value ?? "")
  }

  // categories: id → name (for expenses)
  // categories: column is `name` not `category_name`
  const [catRows] = await conn.query<RowDataPacket[]>(
    "SELECT id, name FROM categories"
  )
  const categoryNameById = new Map<number, string>()
  for (const r of catRows) categoryNameById.set(r.id, r.name)

  // invoice_item_taxes: aggregate by invoice_item_id → first non-zero tax rate
  const [taxRows] = await conn.query<RowDataPacket[]>(
    "SELECT invoice_item_id, tax FROM invoice_item_taxes WHERE tax IS NOT NULL AND tax > 0"
  )
  const taxRateByItemId = new Map<number, number>()
  for (const r of taxRows) {
    if (!taxRateByItemId.has(r.invoice_item_id)) taxRateByItemId.set(r.invoice_item_id, r.tax)
  }

  info(`Loaded ${currRows.length} currencies, ${settRows.length} settings rows`)

  // ── Load users ───────────────────────────────────────────────────────────
  // The old app let users create data before verifying email, so verification
  // alone is the wrong filter. Migrate anyone who is verified OR whose tenant
  // has real data (invoices or clients).
  log(`\n${B}Loading users…${X}`)
  const [userRows] = await conn.query<RowDataPacket[]>(`
    SELECT id, first_name, last_name, email, email_verified_at, password, tenant_id,
           status, contact, created_at
    FROM users u
    WHERE email IS NOT NULL
      AND tenant_id IS NOT NULL
      AND (
        email_verified_at IS NOT NULL
        OR EXISTS (SELECT 1 FROM invoices i WHERE i.tenant_id = u.tenant_id)
        OR EXISTS (SELECT 1 FROM clients c WHERE c.tenant_id = u.tenant_id)
        OR EXISTS (SELECT 1 FROM quotes q WHERE q.tenant_id = u.tenant_id)
        OR EXISTS (SELECT 1 FROM track_expenses e WHERE e.tenant_id = u.tenant_id)
      )
    ORDER BY created_at ASC
  `)

  // Everyone else (no data, never verified) goes to the CSV only
  const [unverifiedRows] = await conn.query<RowDataPacket[]>(`
    SELECT email, first_name, last_name, created_at
    FROM users u
    WHERE email IS NOT NULL
      AND email_verified_at IS NULL
      AND (tenant_id IS NULL OR (
        NOT EXISTS (SELECT 1 FROM invoices i WHERE i.tenant_id = u.tenant_id)
        AND NOT EXISTS (SELECT 1 FROM clients c WHERE c.tenant_id = u.tenant_id)
        AND NOT EXISTS (SELECT 1 FROM quotes q WHERE q.tenant_id = u.tenant_id)
        AND NOT EXISTS (SELECT 1 FROM track_expenses e WHERE e.tenant_id = u.tenant_id)
      ))
  `)

  const [leadRows] = await conn.query<RowDataPacket[]>(`
    SELECT email, created_at FROM lead_emails WHERE email IS NOT NULL
  `)

  const verifiedCount = userRows.filter((u: RowDataPacket) => u.email_verified_at !== null).length
  info(`Users to migrate:           ${userRows.length}`)
  info(`  verified:                 ${verifiedCount}`)
  info(`  unverified but with data: ${userRows.length - verifiedCount}`)
  info(`No data + unverified (CSV only): ${unverifiedRows.length}`)

  // Normalize emails to lowercase — auth lookups (forgot-password, login)
  // lowercase the input, so stored emails must be lowercase too.
  for (const u of userRows) u.email = (u.email as string).trim().toLowerCase()

  // Check for email collisions in new DB (and case-only dupes within old DB)
  const emails = userRows.map((u: RowDataPacket) => u.email as string)
  const existingUsers = await newDb.user.findMany({
    where: { email: { in: emails } },
    select: { email: true },
  })
  const alreadyMigrated = new Set(existingUsers.map((u) => u.email.toLowerCase()))
  if (alreadyMigrated.size > 0) {
    warn(`${alreadyMigrated.size} emails already in new DB — will skip`)
  }

  const seenEmails = new Set<string>()
  const toMigrate = userRows.filter((u: RowDataPacket) => {
    if (alreadyMigrated.has(u.email) || seenEmails.has(u.email)) return false
    seenEmails.add(u.email)
    return true
  })
  info(`Will migrate:              ${toMigrate.length} users`)

  if (toMigrate.length === 0) {
    warn("Nothing to migrate.")
    await conn.end()
    return
  }

  // ── Group users by tenant ───────────────────────────────────────────────────
  // A tenant can have many users (teams, re-signups). One Organization per
  // tenant; the oldest verified user (else just oldest) becomes OWNER, the
  // rest become MEMBERs of the same org — never duplicate the tenant's data.
  const usersByTenant = new Map<string, RowDataPacket[]>()
  for (const u of toMigrate) {
    const list = usersByTenant.get(u.tenant_id) ?? []
    list.push(u)
    usersByTenant.set(u.tenant_id, list)
  }
  info(`Distinct tenants (orgs):   ${usersByTenant.size}`)

  // ── Migrate each tenant ──────────────────────────────────────────────────────
  log(`\n${B}Migrating tenants…${X}`)

  for (const [tid, tenantUsers] of usersByTenant) {
    // Owner: oldest verified user, else oldest user
    tenantUsers.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    const u = tenantUsers.find((x) => x.email_verified_at !== null) ?? tenantUsers[0]
    const memberUsers = tenantUsers.filter((x) => x !== u)

    const tenantId: string = tid
    const settings = settingsByTenant.get(tenantId) ?? new Map<string, string>()

    // --- Org metadata from settings key-value store ---
    // Skip placeholder names ("Your Company Name") — fall back to the user's
    // personal name, then email prefix.
    const personalName = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || null
    const companyName = cleanText(settings.get("company_name"))
    const appName     = cleanText(settings.get("app_name"))
    const orgName     = (!isPlaceholderName(companyName) && companyName) ||
                        (!isPlaceholderName(appName) && appName) ||
                        personalName ||
                        u.email.split("@")[0]

    const timezone   = settings.get("time_zone") || "Asia/Kolkata"
    const currId     = parseInt(settings.get("current_currency") ?? "3", 10) // 3=INR default
    const currCode   = currencyById.get(currId) ?? "INR"
    const currency   = mapCurrency(currCode, `org ${orgName}`)

    const logo   = settings.get("app_logo") || null
    const orgPhone  = settings.get("company_phone") || u.contact || null
    const orgAddress = settings.get("company_address") || null
    const gstin  = settings.get("company_gstin") || null
    const pan    = settings.get("company_pan") || null

    const userName = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email.split("@")[0]

    if (DRY_RUN) {
      const members = memberUsers.length ? ` +${memberUsers.length} members` : ""
      info(`[DRY RUN] ${u.email} → org: "${orgName}" (${currency}, ${timezone})${members}`)
      stats.orgs++; stats.users += tenantUsers.length
      // Count related records in one round-trip
      const [counts] = await conn.query<RowDataPacket[]>(`
        SELECT
          (SELECT COUNT(*) FROM clients        WHERE tenant_id = ?) AS clients,
          (SELECT COUNT(*) FROM invoices       WHERE tenant_id = ?) AS invoices,
          (SELECT COUNT(*) FROM invoice_items  WHERE invoice_id IN (SELECT id FROM invoices WHERE tenant_id = ?)) AS invoice_items,
          (SELECT COUNT(*) FROM payments       WHERE tenant_id = ?) AS payments,
          (SELECT COUNT(*) FROM quotes         WHERE tenant_id = ?) AS quotes,
          (SELECT COUNT(*) FROM quote_items    WHERE quote_id IN (SELECT id FROM quotes WHERE tenant_id = ?)) AS quote_items,
          (SELECT COUNT(*) FROM track_expenses WHERE tenant_id = ?) AS expenses,
          (SELECT COUNT(*) FROM taxes          WHERE tenant_id = ?) AS taxes
      `, [tenantId, tenantId, tenantId, tenantId, tenantId, tenantId, tenantId, tenantId])
      const row = counts[0]
      stats.clients      += Number(row.clients)
      stats.invoices     += Number(row.invoices)
      stats.invoiceItems += Number(row.invoice_items)
      stats.payments     += Number(row.payments)
      stats.quotes       += Number(row.quotes)
      stats.quoteItems   += Number(row.quote_items)
      stats.expenses     += Number(row.expenses)
      stats.taxes        += Number(row.taxes)
      continue
    }

    // --- Ensure unique slug ---
    let baseSlug = slugify(orgName)
    let slug = baseSlug, attempt = 1
    while (await newDb.organization.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${attempt++}`
    }

    try {
      // 1. Organization
      const org = await newDb.organization.create({
        data: {
          name: orgName,
          slug,
          email: u.email,
          phone: orgPhone ?? undefined,
          address: orgAddress ?? undefined,
          gstin: gstin ?? undefined,
          pan: pan ?? undefined,
          logo: logo ?? undefined,
          currency,
          timezone,
          plan: "free",
          isActive: u.status === 1,
          acquisitionSource: "v1_migration",
          createdAt: u.created_at,
        },
      })
      stats.orgs++

      // 2. User (password hash is bcrypt — compatible with NextAuth v5 Credentials)
      const user = await newDb.user.create({
        data: {
          email: u.email,
          name: userName,
          passwordHash: u.password ?? undefined,  // bcrypt hash copied directly
          emailVerified: u.email_verified_at,
          createdAt: u.created_at,
        },
      })
      stats.users++

      // 3. OrgUser (OWNER)
      await newDb.orgUser.create({
        data: { orgId: org.id, userId: user.id, role: "OWNER", joinedAt: u.created_at },
      })

      // 3b. Remaining users of this tenant join the same org as MEMBERs
      for (const m of memberUsers) {
        const mName = `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() || m.email.split("@")[0]
        const member = await newDb.user.create({
          data: {
            email: m.email,
            name: mName,
            passwordHash: m.password ?? undefined,
            emailVerified: m.email_verified_at,
            createdAt: m.created_at,
          },
        })
        await newDb.orgUser.create({
          data: { orgId: org.id, userId: member.id, role: "MEMBER", joinedAt: m.created_at },
        })
        stats.users++
      }

      // 4. Taxes (from old taxes table for this tenant)
      // taxes: old column is `value` (not `rate`), no is_active column
      const [oldTaxes] = await conn.query<RowDataPacket[]>(
        "SELECT name, value, is_default FROM taxes WHERE tenant_id = ?", [tenantId]
      )
      if (oldTaxes.length > 0) {
        await newDb.tax.createMany({
          data: oldTaxes.map((t) => ({
            orgId: org.id,
            name: cleanText(t.name) || "Tax",
            rate: parseFloat(t.value) || 0,
            isDefault: t.is_default === 1,
          })),
        })
        stats.taxes += oldTaxes.length
      }

      // 5. Clients — build old_id → new_id map
      const [oldClients] = await conn.query<RowDataPacket[]>(`
        SELECT c.id, c.company_name, c.address, c.street_address, c.postal_code,
               c.gst_tax, c.note,
               co.short_code as country_code,
               s.name as state_name,
               ci.name as city_name
        FROM clients c
        LEFT JOIN countries co ON co.id = c.country_id
        LEFT JOIN states s     ON s.id  = c.state_id
        LEFT JOIN cities ci    ON ci.id = c.city_id
        WHERE c.tenant_id = ?
      `, [tenantId])

      // client email/phone in tenant_wise_clients → users relation (not stored on clients)
      // We use company_name as the client name; no email/phone available in old schema
      const clientIdMap = new Map<number, string>()
      for (const c of oldClients) {
        const clientName = cleanText(c.company_name) || "Unnamed Client"
        const newClient = await newDb.client.create({
          data: {
            orgId: org.id,
            name: clientName,
            address: c.street_address || c.address || undefined,
            pincode: c.postal_code || undefined,
            gstin: c.gst_tax || undefined,
            notes: cleanText(c.note) ?? undefined,
            country: c.country_code || "IN",
            state: c.state_name || undefined,
            city: c.city_name || undefined,
          },
        })
        clientIdMap.set(c.id, newClient.id)
        stats.clients++
      }

      // 6. Invoices
      const [oldInvoices] = await conn.query<RowDataPacket[]>(`
        SELECT i.id, i.invoice_id as invoice_number, i.client_id, i.status,
               i.invoice_date, i.due_date, i.subtotal, i.total_tax, i.total_discount,
               i.final_amount, i.note, i.term, i.recurring,
               cur.code as currency_code
        FROM invoices i
        LEFT JOIN currencies cur ON cur.id = i.currency_id
        WHERE i.tenant_id = ?
        ORDER BY i.invoice_date ASC
      `, [tenantId])

      const invoiceIdMap = new Map<number, string>()
      for (const inv of oldInvoices) {
        const newClientId = clientIdMap.get(inv.client_id)
        if (!newClientId) {
          warn(`  Invoice ${inv.invoice_number}: client ${inv.client_id} not found — skipping`)
          stats.skipped++
          continue
        }

        const invStatus = mapInvoiceStatus(inv.status)
        const total = parseFloat(inv.final_amount ?? inv.subtotal ?? 0)
        const subtotal = parseFloat(inv.subtotal ?? 0)
        const taxAmount = parseFloat(inv.total_tax ?? 0)
        const discountAmount = parseFloat(inv.total_discount ?? 0)
        const amountPaid = invStatus === "PAID" ? total : 0
        const amountDue = total - amountPaid

        // Ensure unique invoice number within org. Old data has empty and
        // duplicated numbers, so suffix with the old row id until unique.
        let invoiceNumber = String(inv.invoice_number || "").trim() || `INV-${inv.id}`
        let suffix = 0
        while (await newDb.invoice.findFirst({
          where: { orgId: org.id, invoiceNumber },
          select: { id: true },
        })) {
          suffix++
          invoiceNumber = suffix === 1
            ? `${String(inv.invoice_number || "").trim() || "INV"}-${inv.id}`
            : `INV-${inv.id}-${suffix}`
        }

        // Fetch items for this invoice
        const [oldItems] = await conn.query<RowDataPacket[]>(`
          SELECT ii.id, ii.product_name, ii.quantity, ii.price, ii.total
          FROM invoice_items ii
          WHERE ii.invoice_id = ?
          ORDER BY ii.id ASC
        `, [inv.id])

        const newInv = await newDb.invoice.create({
          data: {
            orgId: org.id,
            clientId: newClientId,
            invoiceNumber,
            status: invStatus,
            issueDate: inv.invoice_date,
            dueDate: inv.due_date ?? undefined,
            currency: mapCurrency(inv.currency_code, `invoice ${invoiceNumber}`),
            subtotal,
            taxAmount,
            discountAmount,
            total,
            amountPaid,
            amountDue,
            notes: cleanText(inv.note) ?? undefined,
            terms: cleanText(inv.term) ?? undefined,
            isRecurring: inv.recurring > 0,
            paidAt: invStatus === "PAID" ? inv.due_date ?? inv.invoice_date : undefined,
            items: {
              create: oldItems.map((item, idx) => {
                const taxRate = taxRateByItemId.get(item.id) ?? 0
                const qty = parseFloat(item.quantity) || 1
                const price = parseFloat(item.price) || 0
                const itemTotal = parseFloat(item.total) || qty * price
                const itemTaxAmt = parseFloat(((itemTotal * taxRate) / 100).toFixed(2))
                return {
                  description: cleanText(item.product_name) || "Item",
                  quantity: qty,
                  unitPrice: price,
                  taxRate,
                  taxAmount: itemTaxAmt,
                  discount: 0,
                  total: itemTotal,
                  sortOrder: idx,
                }
              }),
            },
          },
        })
        invoiceIdMap.set(inv.id, newInv.id)
        stats.invoices++
        stats.invoiceItems += oldItems.length
      }

      // 7. Payments
      const [oldPayments] = await conn.query<RowDataPacket[]>(`
        SELECT p.id, p.invoice_id, p.amount, p.payment_mode, p.payment_date,
               p.transaction_id, p.notes,
               cur.code as currency_code
        FROM payments p
        LEFT JOIN currencies cur ON cur.id = (
          SELECT currency_id FROM invoices WHERE id = p.invoice_id LIMIT 1
        )
        WHERE p.tenant_id = ?
      `, [tenantId])

      for (const pmt of oldPayments) {
        const newInvId  = invoiceIdMap.get(pmt.invoice_id)
        const newClientId = newInvId
          ? (await newDb.invoice.findUnique({ where: { id: newInvId }, select: { clientId: true } }))?.clientId
          : undefined

        if (!newInvId || !newClientId) {
          warn(`  Payment ${pmt.id}: invoice ${pmt.invoice_id} not found — skipping`)
          stats.skipped++
          continue
        }

        await newDb.payment.create({
          data: {
            orgId: org.id,
            invoiceId: newInvId,
            clientId: newClientId,
            amount: parseFloat(pmt.amount) || 0,
            currency: mapCurrency(pmt.currency_code, `payment ${pmt.id}`),
            method: mapPaymentMethod(pmt.payment_mode),
            gatewayPaymentId: pmt.transaction_id || undefined,
            status: "completed",
            paidAt: pmt.payment_date,
            notes: pmt.notes || undefined,
          },
        })
        stats.payments++
      }

      // 8. Quotes
      const [oldQuotes] = await conn.query<RowDataPacket[]>(`
        SELECT q.id, q.quote_id as quote_number, q.client_id, q.status,
               q.quote_date, q.due_date, q.amount, q.final_amount,
               q.discount, q.note, q.term
        FROM quotes q
        WHERE q.tenant_id = ?
        ORDER BY q.quote_date ASC
      `, [tenantId])

      for (const qt of oldQuotes) {
        const newClientId = clientIdMap.get(qt.client_id)
        if (!newClientId) { stats.skipped++; continue }

        // Quote status mapping (0=DRAFT,1=SENT,2=ACCEPTED,3=REJECTED,4=EXPIRED — assumed)
        const quoteStatusMap: Record<number, "DRAFT"|"SENT"|"ACCEPTED"|"REJECTED"|"EXPIRED"> = {
          0: "DRAFT", 1: "SENT", 2: "ACCEPTED", 3: "REJECTED", 4: "EXPIRED",
        }
        const quoteStatus = quoteStatusMap[qt.status] ?? "DRAFT"

        let quoteNumber = String(qt.quote_number || "").trim() || `QT-${qt.id}`
        let qtSuffix = 0
        while (await newDb.quote.findFirst({
          where: { orgId: org.id, quoteNumber },
          select: { id: true },
        })) {
          qtSuffix++
          quoteNumber = qtSuffix === 1
            ? `${String(qt.quote_number || "").trim() || "QT"}-${qt.id}`
            : `QT-${qt.id}-${qtSuffix}`
        }

        const [oldQItems] = await conn.query<RowDataPacket[]>(
          "SELECT * FROM quote_items WHERE quote_id = ? ORDER BY id ASC", [qt.id]
        )

        // quotes has no currency_id; quotes also has no subtotal/total_tax separately
        const total = parseFloat(qt.final_amount ?? qt.amount ?? 0)
        const discountAmt = parseFloat(qt.discount ?? 0)
        await newDb.quote.create({
          data: {
            orgId: org.id,
            clientId: newClientId,
            quoteNumber,
            status: quoteStatus,
            issueDate: qt.quote_date,
            expiryDate: qt.due_date ?? undefined,
            currency,                             // inherit org currency
            subtotal: total + discountAmt,
            taxAmount: 0,
            discountAmount: discountAmt,
            total,
            notes: cleanText(qt.note) ?? undefined,
            terms: cleanText(qt.term) ?? undefined,
            acceptedAt: quoteStatus === "ACCEPTED" ? qt.due_date ?? qt.quote_date : undefined,
            rejectedAt: quoteStatus === "REJECTED" ? qt.due_date ?? qt.quote_date : undefined,
            items: {
              create: oldQItems.map((qi, idx) => ({
                description: cleanText(qi.product_name) || "Item",
                quantity: parseFloat(qi.quantity) || 1,
                unitPrice: parseFloat(qi.price) || 0,
                taxRate: 0,
                taxAmount: 0,
                discount: 0,
                total: parseFloat(qi.total) || 0,
                sortOrder: idx,
              })),
            },
          },
        })
        stats.quotes++
        stats.quoteItems += oldQItems.length
      }

      // 9. Expenses
      const [oldExpenses] = await conn.query<RowDataPacket[]>(`
        SELECT e.id, e.expense_date, e.category_id, e.amount, e.currency_id,
               e.description, e.url, e.invoice as is_billable
        FROM track_expenses e
        WHERE e.tenant_id = ?
      `, [tenantId])

      for (const ex of oldExpenses) {
        const currCode2 = currencyById.get(ex.currency_id) ?? "INR"
        await newDb.expense.create({
          data: {
            orgId: org.id,
            title: cleanText(ex.description)?.slice(0, 80) || "Expense",
            amount: parseFloat(ex.amount) || 0,
            currency: mapCurrency(currCode2, `expense ${ex.id}`),
            date: ex.expense_date,
            receiptUrl: ex.url || undefined,
            notes: cleanText(ex.description) ?? undefined,
            isBillable: ex.is_billable === 1,
          },
        })
        stats.expenses++
      }

      ok(`${u.email} — ${oldClients.length} clients, ${oldInvoices.length} invoices, ${oldPayments.length} payments`)

    } catch (e) {
      err(`Failed: ${u.email} — ${e instanceof Error ? e.message : String(e)}`)
      if (e instanceof Error && e.stack) console.error(e.stack)
      stats.skipped++
    }
  }

  // ── Contacts export (all distinct emails, segmented) ──────────────────────
  // Segments: migrated (verified, account ready) > unverified (signup never
  // finished) > lead (newsletter capture only). First match wins on dupes.
  log(`\n${B}Exporting contacts CSV…${X}`)
  const csvEscape = (s: string) => /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  const seen = new Set<string>()
  const csvLines = ["email,name,segment,signed_up_at"]
  const addContact = (email: string, name: string, segment: string, createdAt: Date | null) => {
    const key = email.trim().toLowerCase()
    if (!key || seen.has(key)) return
    seen.add(key)
    const date = createdAt ? new Date(createdAt).toISOString().slice(0, 10) : ""
    csvLines.push([csvEscape(key), csvEscape(name), segment, date].join(","))
  }
  for (const u of toMigrate) {
    addContact(u.email, `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim(), "migrated", u.created_at)
  }
  for (const u of unverifiedRows) {
    addContact(u.email, `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim(), "unverified", u.created_at)
  }
  for (const l of leadRows) {
    addContact(l.email, "", "lead", l.created_at)
  }
  const csvPath = path.resolve(__dirname, "contacts-export.csv")
  fs.writeFileSync(csvPath, csvLines.join("\n") + "\n", "utf8")
  ok(`${seen.size} distinct contacts → ${csvPath}`)
  info(`  migrated:   ${toMigrate.length}`)
  info(`  unverified: ${csvLines.filter(l => l.includes(",unverified,")).length}`)
  info(`  lead:       ${csvLines.filter(l => l.includes(",lead,")).length}`)

  // ── Summary ────────────────────────────────────────────────────────────────
  log(`\n${B}══════════════════════════════════════════${X}`)
  log(`${B}  Migration ${DRY_RUN ? "Dry Run " : ""}Summary${X}`)
  log(`${B}══════════════════════════════════════════${X}`)
  if (DRY_RUN) {
    log(`${Y}${B}DRY RUN — nothing was written${X}`)
  }
  log(`  Organizations:  ${stats.orgs}`)
  log(`  Users:          ${stats.users}`)
  log(`  Clients:        ${stats.clients}`)
  log(`  Invoices:       ${stats.invoices}`)
  log(`  Invoice items:  ${stats.invoiceItems}`)
  log(`  Payments:       ${stats.payments}`)
  log(`  Quotes:         ${stats.quotes}`)
  log(`  Quote items:    ${stats.quoteItems}`)
  log(`  Expenses:       ${stats.expenses}`)
  log(`  Taxes:          ${stats.taxes}`)
  if (stats.skipped > 0) log(`${Y}  Skipped/errors: ${stats.skipped}${X}`)
  log("")

  if (!DRY_RUN) {
    log(`${G}${B}DONE ✓${X}`)
    log(`\nNext steps:`)
    log(`  1. Spot-check a few users — log in with their old password`)
    log(`  2. Verify invoice totals match old system`)
    log(`  3. Send migration email to users (trigger password reset if needed)`)
  } else {
    log(`Run ${B}npm run migrate:run${X} to execute the migration.`)
  }

  await conn.end()
  await newDb.$disconnect()
}

main().catch((e) => {
  err(`FATAL: ${e instanceof Error ? e.message : String(e)}`)
  if (e instanceof Error && e.stack) console.error(e.stack)
  process.exit(1)
})
