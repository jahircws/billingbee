import { config } from "dotenv"
config()
import { PrismaClient } from "../lib/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
const PG_URL = process.env.DATABASE_URL?.startsWith("prisma+postgres") ? process.env.DIRECT_DATABASE_URL : process.env.DATABASE_URL
const db = new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString: PG_URL, ssl: { rejectUnauthorized: false } })) })
async function main() {
  console.log("orgs:", await db.organization.count())
  console.log("orgs v1_migration:", await db.organization.count({ where: { acquisitionSource: "v1_migration" } }))
  console.log("users:", await db.user.count())
  console.log("clients:", await db.client.count())
  console.log("invoices:", await db.invoice.count())
}
main().finally(() => db.$disconnect())
