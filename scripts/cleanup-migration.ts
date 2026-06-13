import { config } from "dotenv"
config()
import { PrismaClient } from "../lib/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const PG_URL = process.env.DATABASE_URL?.startsWith("prisma+postgres")
  ? process.env.DIRECT_DATABASE_URL
  : process.env.DATABASE_URL

const db = new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString: PG_URL, ssl: { rejectUnauthorized: false } })) })

async function main() {
  // Delete migrated orgs — cascades to orgUsers, taxes, clients, invoices, etc.
  const orgs = await db.organization.deleteMany({ where: { acquisitionSource: "v1_migration" } })
  // Delete users left with no org membership
  const users = await db.user.deleteMany({ where: { orgUsers: { none: {} } } })
  console.log(`Deleted ${orgs.count} orgs, ${users.count} orphaned users`)
}
main().finally(() => db.$disconnect())
