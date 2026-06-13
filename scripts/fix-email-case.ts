import { config } from "dotenv"
config()
import { PrismaClient } from "../lib/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
const PG_URL = process.env.DATABASE_URL?.startsWith("prisma+postgres") ? process.env.DIRECT_DATABASE_URL : process.env.DATABASE_URL
const db = new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString: PG_URL })) })
async function main() {
  const users = await db.user.findMany({ select: { id: true, email: true } })
  const lowerSet = new Map<string, number>()
  for (const u of users) lowerSet.set(u.email.toLowerCase(), (lowerSet.get(u.email.toLowerCase()) ?? 0) + 1)
  let fixed = 0, conflicts = 0
  for (const u of users) {
    const lower = u.email.toLowerCase()
    if (u.email === lower) continue
    if ((lowerSet.get(lower) ?? 0) > 1) { console.log(`CONFLICT (skipped): ${u.email}`); conflicts++; continue }
    await db.user.update({ where: { id: u.id }, data: { email: lower } })
    fixed++
  }
  console.log(`Lowercased ${fixed} emails, ${conflicts} conflicts skipped`)
}
main().finally(() => db.$disconnect())
