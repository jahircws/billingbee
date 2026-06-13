/**
 * Backfill invoices that were skipped during v1→v2 migration due to
 * cross-tenant client references in the old MySQL DB.
 *
 * Usage:
 *   npm run tsx scripts/backfill-skipped-invoices.ts --dry-run
 *   npm run tsx scripts/backfill-skipped-invoices.ts
 */
import { config } from "dotenv"
config({ path: ".env.local", override: true })

import mysql, { RowDataPacket } from "mysql2/promise"
import { PrismaClient, Currency, InvoiceStatus, PaymentMethod } from "../lib/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import fs from "fs"

const DRY_RUN = process.argv.includes("--dry-run")
const PG_URL = process.env.DATABASE_URL
const newDb = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: PG_URL, ssl: { rejectUnauthorized: false } })),
  log: [],
})

const B = "\x1b[1m", G = "\x1b[32m", Y = "\x1b[33m", R = "\x1b[31m", C = "\x1b[36m", X = "\x1b[0m"
const log  = (m: string) => console.log(m)
const info = (m: string) => console.log(`${C}  ${m}${X}`)
const ok   = (m: string) => console.log(`${G}  ✓ ${m}${X}`)
const warn = (m: string) => console.log(`${Y}  ⚠ ${m}${X}`)
const err  = (m: string) => console.error(`${R}  ✗ ${m}${X}`)

const SUPPORTED_CURRENCIES = new Set(["INR","USD","EUR","GBP","AUD","CAD","SGD","AED"])
function mapCurrency(code: string | null | undefined): Currency {
  if (!code) return "INR"
  const u = code.toUpperCase()
  return SUPPORTED_CURRENCIES.has(u) ? u as Currency : "USD"
}

const INVOICE_STATUS: Record<number, InvoiceStatus> = {
  0: "DRAFT", 1: "UNPAID", 2: "PAID", 3: "UNPAID", 4: "OVERDUE",
}
const PAYMENT_METHOD: Record<number, PaymentMethod> = {
  1: "OTHER", 2: "STRIPE", 3: "PAYPAL", 4: "CASH",
  5: "RAZORPAY", 6: "CHEQUE", 7: "BANK_TRANSFER", 8: "OTHER",
}

function cleanText(s: string | null | undefined): string | null {
  if (!s || s === "null") return null
  const c = s.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">")
             .replace(/&quot;/g,'"').replace(/&#0?39;/g,"'").replace(/&nbsp;/g," ").trim()
  return c || null
}

const stats = { orgs: 0, clients_created: 0, invoices: 0, items: 0, skipped: 0 }

async function main() {
  log(`\n${B}══════════════════════════════════════════${X}`)
  log(`${B}  Backfill Skipped Invoices${DRY_RUN ? " [DRY RUN]" : ""}${X}`)
  log(`${B}══════════════════════════════════════════${X}`)

  const conn = await mysql.createConnection({
    uri: process.env.OLD_MYSQL_URL!,
    ssl: { ca: fs.readFileSync("global-bundle.pem") },
  })

  // Load tax rates by invoice_item_id
  const [taxRows] = await conn.query<RowDataPacket[]>(
    "SELECT invoice_item_id, tax FROM invoice_item_taxes WHERE tax IS NOT NULL AND tax > 0"
  )
  const taxRateByItemId = new Map<number, number>()
  for (const r of taxRows) {
    if (!taxRateByItemId.has(r.invoice_item_id)) taxRateByItemId.set(r.invoice_item_id, r.tax)
  }

  // Load currencies
  const [currRows] = await conn.query<RowDataPacket[]>("SELECT id, code FROM currencies")
  const currencyById = new Map<number, string>()
  for (const r of currRows) currencyById.set(r.id, r.code ?? "INR")

  // Find all cross-tenant invoice groups
  const [groups] = await conn.query<RowDataPacket[]>(`
    SELECT
      i.tenant_id,
      i.client_id,
      c.company_name AS client_name,
      c.street_address, c.address, c.postal_code, c.gst_tax, c.note,
      co.short_code AS country_code,
      s.name AS state_name,
      ci.name AS city_name
    FROM invoices i
    LEFT JOIN clients c ON c.id = i.client_id
    LEFT JOIN countries co ON co.id = c.country_id
    LEFT JOIN states s ON s.id = c.state_id
    LEFT JOIN cities ci ON ci.id = c.city_id
    WHERE c.tenant_id != i.tenant_id OR c.tenant_id IS NULL
    GROUP BY i.tenant_id, i.client_id, c.company_name, c.street_address, c.address,
             c.postal_code, c.gst_tax, c.note, co.short_code, s.name, ci.name
  `)

  info(`Found ${groups.length} cross-tenant client groups to process`)

  // Group by tenant_id
  const byTenant = new Map<string, RowDataPacket[]>()
  for (const g of groups) {
    const list = byTenant.get(g.tenant_id) ?? []
    list.push(g)
    byTenant.set(g.tenant_id, list)
  }

  for (const [tenantId, clientGroups] of byTenant) {
    // Find the org in new DB — match by acquisitionSource + email from old DB
    const [userRows] = await conn.query<RowDataPacket[]>(
      "SELECT email FROM users WHERE tenant_id = ? ORDER BY created_at ASC LIMIT 1", [tenantId]
    )
    if (!userRows.length) { warn(`No user for tenant ${tenantId}`); continue }
    const email = (userRows[0].email as string).trim().toLowerCase()

    const org = await newDb.organization.findFirst({
      where: { email, acquisitionSource: "v1_migration" },
    })
    if (!org) { warn(`Org not found for ${email} (tenant ${tenantId})`); stats.skipped++; continue }

    log(`\n${B}${email}${X} → org ${org.id}`)
    stats.orgs++

    for (const g of clientGroups) {
      const clientName = cleanText(g.client_name) || "Unnamed Client"

      // Find or create client in this org
      let client = await newDb.client.findFirst({
        where: { orgId: org.id, name: clientName },
      })

      if (!client) {
        if (!DRY_RUN) {
          client = await newDb.client.create({
            data: {
              orgId: org.id,
              name: clientName,
              address: g.street_address || g.address || undefined,
              pincode: g.postal_code || undefined,
              gstin: g.gst_tax || undefined,
              notes: cleanText(g.note) ?? undefined,
              country: g.country_code || "IN",
              state: g.state_name || undefined,
              city: g.city_name || undefined,
            },
          })
          ok(`Created client "${clientName}"`)
        } else {
          info(`[DRY RUN] Would create client "${clientName}"`)
        }
        stats.clients_created++
      } else {
        info(`Client "${clientName}" already exists`)
      }

      // Fetch invoices for this tenant + client_id that aren't yet migrated
      const [oldInvoices] = await conn.query<RowDataPacket[]>(`
        SELECT i.id, i.invoice_id AS invoice_number, i.client_id, i.status,
               i.invoice_date, i.due_date, i.subtotal, i.total_tax, i.total_discount,
               i.final_amount, i.note, i.term, i.recurring,
               cur.code AS currency_code
        FROM invoices i
        LEFT JOIN currencies cur ON cur.id = i.currency_id
        WHERE i.tenant_id = ? AND i.client_id = ?
        ORDER BY i.invoice_date ASC
      `, [tenantId, g.client_id])

      for (const inv of oldInvoices) {
        let invoiceNumber = String(inv.invoice_number || "").trim() || `INV-${inv.id}`

        // Skip if already migrated
        const exists = await newDb.invoice.findFirst({
          where: { orgId: org.id, invoiceNumber },
          select: { id: true },
        })
        // Also check with -id suffix
        const existsById = await newDb.invoice.findFirst({
          where: { orgId: org.id, invoiceNumber: `INV-${inv.id}` },
          select: { id: true },
        })
        if (exists || existsById) {
          info(`  Invoice ${invoiceNumber} already exists — skipping`)
          continue
        }

        // Ensure unique invoice number
        let suffix = 0
        while (await newDb.invoice.findFirst({ where: { orgId: org.id, invoiceNumber }, select: { id: true } })) {
          suffix++
          invoiceNumber = suffix === 1
            ? `${String(inv.invoice_number || "").trim() || "INV"}-${inv.id}`
            : `INV-${inv.id}-${suffix}`
        }

        const [oldItems] = await conn.query<RowDataPacket[]>(`
          SELECT ii.id, ii.product_name, ii.quantity, ii.price, ii.total
          FROM invoice_items ii WHERE ii.invoice_id = ? ORDER BY ii.id ASC
        `, [inv.id])

        const invStatus = INVOICE_STATUS[inv.status] ?? "UNPAID"
        const total = parseFloat(inv.final_amount ?? inv.subtotal ?? 0)
        const subtotal = parseFloat(inv.subtotal ?? 0)
        const taxAmount = parseFloat(inv.total_tax ?? 0)
        const discountAmount = parseFloat(inv.total_discount ?? 0)
        const amountPaid = invStatus === "PAID" ? total : 0
        const amountDue = total - amountPaid

        if (DRY_RUN) {
          info(`  [DRY RUN] Would migrate invoice ${invoiceNumber} (${invStatus}, ${oldItems.length} items)`)
          stats.invoices++
          stats.items += oldItems.length
          continue
        }

        if (!client) { stats.skipped++; continue }

        await newDb.invoice.create({
          data: {
            orgId: org.id,
            clientId: client.id,
            invoiceNumber,
            status: invStatus,
            issueDate: inv.invoice_date,
            dueDate: inv.due_date ?? undefined,
            currency: mapCurrency(inv.currency_code),
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

        ok(`  Invoice ${invoiceNumber} (${invStatus}, ${oldItems.length} items)`)
        stats.invoices++
        stats.items += oldItems.length
      }
    }
  }

  log(`\n${B}══════════════════════════════════════════${X}`)
  log(`${B}  Backfill ${DRY_RUN ? "Dry Run " : ""}Summary${X}`)
  log(`${B}══════════════════════════════════════════${X}`)
  if (DRY_RUN) log(`${Y}${B}DRY RUN — nothing was written${X}`)
  log(`  Orgs processed:    ${stats.orgs}`)
  log(`  Clients created:   ${stats.clients_created}`)
  log(`  Invoices migrated: ${stats.invoices}`)
  log(`  Invoice items:     ${stats.items}`)
  if (stats.skipped) log(`${Y}  Skipped:           ${stats.skipped}${X}`)

  await conn.end()
  await newDb.$disconnect()
}

main().catch((e) => {
  err(`FATAL: ${e instanceof Error ? e.message : String(e)}`)
  process.exit(1)
})
