import { config } from "dotenv"
config({ path: ".env.local", override: true })
import mysql from "mysql2/promise"
import fs from "fs"

async function main() {
  const conn = await mysql.createConnection({
    uri: process.env.OLD_MYSQL_URL!,
    ssl: { ca: fs.readFileSync("global-bundle.pem") }
  })
  const [cols] = await conn.query("DESCRIBE clients")
  console.log("Columns:", (cols as any[]).map((c: any) => c.Field).join(", "))
  const [rows] = await conn.query(`
    SELECT c.id, c.company_name, c.contact_person, c.email, c.phone
    FROM clients c
    WHERE (c.company_name IS NULL OR TRIM(c.company_name) = '')
    LIMIT 5
  `)
  console.log("Sample:", JSON.stringify(rows, null, 2))
  await conn.end()
}
main().catch(console.error)
