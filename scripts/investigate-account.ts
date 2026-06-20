import { config } from "dotenv"
config({ path: ".env.local", override: true })
import { PrismaClient } from "../lib/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import mysql from "mysql2/promise"
import fs from "fs"

const EMAIL = "shiwani@cwstechnology.com"
const newDb = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })),
})

async function main() {
  const conn = await mysql.createConnection({
    uri: process.env.OLD_MYSQL_URL!,
    ssl: { ca: fs.readFileSync("global-bundle.pem") }
  })

  const [users] = await conn.query<any[]>("SELECT id, tenant_id FROM users WHERE email = ?", [EMAIL])
  if (!users.length) { console.log("User not found in old DB"); return }
  const TID = users[0].tenant_id

  // Check expense columns
  const [cols] = await conn.query<any[]>("SHOW COLUMNS FROM track_expenses")
  console.log("expense cols:", cols.map((c: any) => c.Field).join(", "))

  const [clients] = await conn.query<any[]>("SELECT id, company_name FROM clients WHERE tenant_id = ?", [TID])
  const [invoices] = await conn.query<any[]>("SELECT id, invoice_id, status FROM invoices WHERE tenant_id = ?", [TID])
  const [expenses] = await conn.query<any[]>("SELECT * FROM track_expenses WHERE tenant_id = ? LIMIT 5", [TID])
  const [products] = await conn.query<any[]>("SELECT id, name FROM products WHERE tenant_id = ? LIMIT 10", [TID])

  console.log(`\n=== OLD DB (tenant: ${TID}) ===`)
  console.log(`Clients (${clients.length}):`, clients.map((c: any) => `${c.id}:"${c.company_name}"`))
  console.log(`Invoices (${invoices.length}):`, invoices.map((i: any) => `#${i.invoice_id}(${i.status})`))
  console.log(`Expenses (${expenses.length}):`, expenses)
  console.log(`Products (${products.length}):`, products.map((p: any) => p.name))

  const org = await newDb.organization.findFirst({ where: { email: EMAIL } })
  if (!org) { console.log("No org in new DB"); return }

  const newClients = await newDb.client.findMany({ where: { orgId: org.id } })
  const newInvoices = await newDb.invoice.findMany({ where: { orgId: org.id } })
  const newExpenses = await newDb.expense.findMany({ where: { orgId: org.id } })

  console.log(`\n=== NEW DB ===`)
  console.log(`Clients (${newClients.length}):`, newClients.map(c => `"${c.name}"`))
  console.log(`Invoices (${newInvoices.length}):`, newInvoices.map(i => `#${i.invoiceNumber}(${i.status})`))
  console.log(`Expenses (${newExpenses.length}):`, newExpenses.map(e => e.title))

  await conn.end()
  await newDb.$disconnect()
}
main().catch(console.error)
