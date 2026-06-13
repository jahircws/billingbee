/**
 * Manually fetch today's FX rates and upsert them into the FxRate table.
 * Same work the daily app/api/cron/fx-rates job does — handy for the first
 * population after a deploy, or to backfill a missed day.
 *
 * Usage:
 *   npm run fx:refresh
 *
 * Env: loads .env then .env.local (override), matching Next.js precedence, so it
 * targets the same database the app uses.
 */
import { config } from "dotenv"
config({ path: ".env" })
config({ path: ".env.local", override: true })

async function main() {
  const { refreshDailyRates } = await import("../lib/fx")
  const written = await refreshDailyRates()
  console.log(`Wrote ${written} FxRate row(s) for today.`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
