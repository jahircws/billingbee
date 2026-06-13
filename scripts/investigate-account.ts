import { config } from "dotenv"
config({ path: ".env.local", override: true })
import mysql from "mysql2/promise"
import fs from "fs"

async function main() {
  const conn = await mysql.createConnection({
    uri: process.env.OLD_MYSQL_URL!,
    ssl: { ca: fs.readFileSync("global-bundle.pem") }
  })

  // client 1257 has user_id=6123 in tenant_wise_clients
  const [u] = await conn.query<any[]>("SELECT id, first_name, last_name, email, tenant_id FROM users WHERE id = 6123")
  console.log("user 6123:", JSON.stringify(u[0]))

  // Check all null-named clients for this tenant — pull name from linked user
  const [rows] = await conn.query<any[]>(`
    SELECT c.id AS client_id, c.company_name, c.client_type,
           u.first_name, u.last_name, u.email,
           c.street_address, c.address, c.gst_tax, c.postal_code
    FROM clients c
    LEFT JOIN tenant_wise_clients twc ON twc.client_id = c.id AND twc.tenant_id = c.tenant_id
    LEFT JOIN users u ON u.id = twc.user_id
    WHERE c.tenant_id = '6bf85c44-c697-414f-ac35-4b6c29dbf299'
      AND (c.company_name IS NULL OR c.company_name = 'null' OR c.company_name = '')
  `)
  console.log("\nNull-named clients with user names:")
  for (const r of rows) {
    const name = [r.first_name, r.last_name].filter(Boolean).join(" ") || "(no user name)"
    console.log(`  client_id=${r.client_id} type=${r.client_type} → "${name}" (${r.email})`)
  }

  await conn.end()
}
main().catch(console.error)
