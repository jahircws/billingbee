import { PrismaClient } from './lib/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  const config = await prisma.paymentGatewayConfig.findFirst({
    where: { isActive: true },
    select: { orgId: true, gateway: true }
  })

  if (!config) {
    console.log('No orgs with active gateway config found')
    console.log('Connect Razorpay or Stripe in /settings/gateways first')
    process.exit(1)
  }

  console.log('Found org with gateway:', config.gateway, '| Org ID:', config.orgId)

  const inv = await prisma.invoice.findFirst({
    where: { orgId: config.orgId, status: { not: 'PAID' } },
    select: { id: true, orgId: true, currency: true }
  })

  if (!inv) {
    console.log('No unpaid invoices for this org — create one in the dashboard first')
    process.exit(1)
  }

  console.log('Invoice ID:', inv.id)
  console.log('Org ID:', inv.orgId)
  console.log('Currency:', inv.currency)
  await prisma.$disconnect()
  await pool.end()
}

main()
