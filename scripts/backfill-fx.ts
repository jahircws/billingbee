/**
 * Backfill Invoice.fxRate for invoices created before FX capture existed.
 *
 * fxRate = units of the org's base currency per 1 unit of the invoice currency,
 * frozen at issue time. Same-currency invoices are already correct (default 1),
 * so this only touches cross-currency invoices.
 *
 * Resolution order per invoice:
 *   1. Stored rate nearest to (≤) the invoice's issueDate.
 *   2. Fallback: latest available rate (approximation for invoices older than
 *      the earliest fetched rate).
 *   3. If no rate at all is available, the invoice is flagged and left at 1.
 *
 * ALWAYS run dry first. Idempotent — safe to re-run.
 *
 * Usage:
 *   npm run backfill:fx:dry   ← reads + reports, writes nothing
 *   npm run backfill:fx       ← writes fxRate on cross-currency invoices
 *
 * Env: loads .env then .env.local (override), matching Next.js precedence.
 */
import { config } from "dotenv"
config({ path: ".env" })
config({ path: ".env.local", override: true })

async function main() {
  const dryRun = process.argv.includes("--dry-run")
  const { default: prisma } = await import("../lib/db")
  const { getFxRate } = await import("../lib/fx")

  // Org base currency lookup
  const orgs = await prisma.organization.findMany({ select: { id: true, currency: true } })
  const baseByOrg = new Map(orgs.map((o) => [o.id, o.currency]))

  const invoices = await prisma.invoice.findMany({
    select: { id: true, orgId: true, invoiceNumber: true, currency: true, issueDate: true, fxRate: true },
  })

  let updated = 0
  let alreadyOk = 0
  let flagged = 0
  const samples: string[] = []

  for (const inv of invoices) {
    const base = baseByOrg.get(inv.orgId) ?? "INR"

    // Same currency → rate is 1 by definition; default already correct.
    if (inv.currency === base) {
      alreadyOk++
      continue
    }

    // Prefer the rate at issue time; fall back to the latest available rate.
    const rate =
      (await getFxRate(inv.currency, base, inv.issueDate)) ??
      (await getFxRate(inv.currency, base, new Date()))

    if (rate == null) {
      flagged++
      if (samples.length < 25) samples.push(`  ! ${inv.invoiceNumber}  ${inv.currency}→${base}  NO RATE (left at 1)`)
      continue
    }

    // Idempotent: skip if already set to (approximately) this rate.
    if (Math.abs(Number(inv.fxRate) - rate) < 1e-8) {
      alreadyOk++
      continue
    }

    if (samples.length < 25) samples.push(`  - ${inv.invoiceNumber}  ${inv.currency}→${base}  fxRate=${rate.toFixed(6)}`)
    if (!dryRun) {
      await prisma.invoice.update({ where: { id: inv.id }, data: { fxRate: rate } })
    }
    updated++
  }

  console.log(`Invoices scanned:        ${invoices.length}`)
  console.log(`Same-currency / already: ${alreadyOk}`)
  console.log(`${dryRun ? "Would update" : "Updated"}:            ${updated}`)
  console.log(`Flagged (no rate):       ${flagged}`)
  if (samples.length) {
    console.log("\nSamples:")
    samples.forEach((s) => console.log(s))
  }
  if (dryRun) console.log("\nDry run — no writes performed.")
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
