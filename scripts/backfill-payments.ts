/**
 * Backfill Payment records for already-PAID invoices that have none.
 *
 * Historically, marking an invoice "paid" manually did not create a Payment row
 * (only gateway payments did), so the client portal's Transaction History is
 * empty for those invoices. This creates one Payment per PAID invoice lacking
 * one, mirroring the manual-payment shape in updateInvoiceStatus.
 *
 * Usage:
 *   npm run backfill:payments:dry   ← reads + reports, writes nothing
 *   npm run backfill:payments       ← creates the missing Payment rows
 *
 * Env: loads .env then .env.local (override), matching Next.js precedence, so it
 * targets the same database the app uses.
 */
import { config } from "dotenv"
config({ path: ".env" })
config({ path: ".env.local", override: true })

async function main() {
  const dryRun = process.argv.includes("--dry-run")
  const { default: prisma } = await import("../lib/db")

  const invoices = await prisma.invoice.findMany({
    where: { status: "PAID", payments: { none: {} } },
    select: {
      id: true,
      orgId: true,
      clientId: true,
      invoiceNumber: true,
      total: true,
      amountPaid: true,
      currency: true,
      paidAt: true,
      updatedAt: true,
    },
  })

  console.log(`Found ${invoices.length} PAID invoice(s) without a Payment record.`)

  if (dryRun) {
    for (const inv of invoices.slice(0, 25)) {
      console.log(`  - ${inv.invoiceNumber}  ${inv.currency} ${Number(inv.total)}`)
    }
    if (invoices.length > 25) console.log(`  …and ${invoices.length - 25} more`)
    console.log("Dry run — no writes performed.")
    return
  }

  let created = 0
  for (const inv of invoices) {
    const amount = Number(inv.amountPaid) > 0 ? inv.amountPaid : inv.total
    await prisma.payment.create({
      data: {
        orgId: inv.orgId,
        invoiceId: inv.id,
        clientId: inv.clientId,
        amount,
        currency: inv.currency,
        method: "OTHER",
        status: "captured",
        paidAt: inv.paidAt ?? inv.updatedAt,
        notes: "Backfilled from paid invoice",
      },
    })
    created++
  }
  console.log(`Created ${created} Payment record(s).`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
