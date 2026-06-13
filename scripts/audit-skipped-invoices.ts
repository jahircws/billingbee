import { config } from "dotenv"
config({ path: ".env.local", override: true })
import mysql from "mysql2/promise"
import fs from "fs"

async function main() {
  const conn = await mysql.createConnection({
    uri: process.env.OLD_MYSQL_URL!,
    ssl: { ca: fs.readFileSync("global-bundle.pem") }
  })

  // All invoices where client_id doesn't belong to the same tenant
  const [rows] = await conn.query<any[]>(`
    SELECT
      i.tenant_id,
      i.client_id,
      c.company_name AS client_name,
      c.tenant_id AS client_tenant_id,
      COUNT(*) AS invoice_count
    FROM invoices i
    LEFT JOIN clients c ON c.id = i.client_id
    WHERE c.tenant_id != i.tenant_id OR c.tenant_id IS NULL
    GROUP BY i.tenant_id, i.client_id, c.company_name, c.tenant_id
    ORDER BY invoice_count DESC
  `)

  console.log(`\nTotal cross-tenant invoice groups: ${rows.length}`)
  const total = rows.reduce((s: number, r: any) => s + Number(r.invoice_count), 0)
  console.log(`Total affected invoices: ${total}`)

  const tenants = new Set(rows.map((r: any) => r.tenant_id))
  console.log(`Affected tenants (orgs): ${tenants.size}`)

  console.log(`\nTop 20 by invoice count:`)
  for (const r of rows.slice(0, 20)) {
    console.log(`  tenant=${r.tenant_id?.slice(0,8)}… client_id=${r.client_id} "${r.client_name}" (client_tenant=${r.client_tenant_id?.slice(0,8)}…) → ${r.invoice_count} invoices`)
  }

  await conn.end()
}
main().catch(console.error)
