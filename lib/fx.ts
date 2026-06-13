import prisma from "@/lib/db"
import { Currency } from "@/lib/generated/prisma/client"

// All currencies BillingBee supports (mirrors the Currency enum in schema.prisma).
export const CURRENCIES: Currency[] = [
  // South Asia
  "INR", "PKR", "BDT", "LKR", "NPR", "MVR",
  // North America
  "USD", "CAD", "MXN",
  // Europe
  "EUR", "GBP", "CHF", "SEK", "NOK", "DKK", "PLN", "CZK", "HUF", "RON", "BGN", "ISK", "UAH", "RSD", "BAM", "MKD", "MDL",
  // East Asia
  "JPY", "CNY", "KRW", "TWD", "HKD", "MNT",
  // Southeast Asia
  "SGD", "MYR", "THB", "PHP", "IDR", "VND", "KHR", "BND", "MOP", "LAK",
  // Central Asia
  "KZT", "UZS", "AZN", "GEL", "AMD", "KGS", "TJS", "TMT",
  // Middle East & North Africa
  "AED", "SAR", "QAR", "KWD", "BHD", "OMR", "JOD", "ILS", "IQD", "EGP", "MAD", "TND", "DZD",
  // Sub-Saharan Africa
  "ZAR", "NGN", "KES", "GHS", "ETB", "TZS", "UGX", "RWF", "MUR", "XAF", "XOF", "ZMW", "BWP", "SCR", "MZN", "AOA", "MGA", "CDF", "MWK", "CVE",
  // Latin America
  "BRL", "ARS", "CLP", "COP", "PEN", "UYU", "BOB", "GTQ", "HNL", "DOP", "TTD", "JMD", "CRC", "PYG", "NIO", "GYD", "SRD",
  // Pacific
  "AUD", "NZD", "FJD", "PGK", "XPF",
  // Caribbean
  "XCD",
]

// We anchor every stored rate to USD: one row per currency per day with
// base = USD, rate = units of `quote` per 1 USD (exactly what open.er-api.com
// returns). Any cross rate is derived as rates[to] / rates[from], so a single
// daily fetch covers all 8×8 pairs.
const ANCHOR: Currency = "USD"

const API_URL = `https://open.er-api.com/v6/latest/${ANCHOR}`

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

interface ErApiResponse {
  result: string
  base_code: string
  rates: Record<string, number>
}

/**
 * Fetch today's USD-anchored rates and upsert one FxRate row per supported
 * currency. Idempotent per day (unique on date+base+quote). Returns the number
 * of rows written. Called by the daily fx-rates cron.
 */
export async function refreshDailyRates(now: Date = new Date()): Promise<number> {
  const res = await fetch(API_URL, { headers: { accept: "application/json" } })
  if (!res.ok) throw new Error(`FX fetch failed: ${res.status} ${res.statusText}`)

  const data = (await res.json()) as ErApiResponse
  if (data.result !== "success" || !data.rates) {
    throw new Error(`FX API returned non-success result: ${data.result}`)
  }

  const date = startOfUtcDay(now)
  let written = 0

  for (const quote of CURRENCIES) {
    const rate = quote === ANCHOR ? 1 : data.rates[quote]
    if (typeof rate !== "number" || !(rate > 0)) {
      // Skip a currency the API didn't return rather than poisoning the table.
      console.warn(`[fx] missing/invalid rate for ${quote}, skipping`)
      continue
    }
    await prisma.fxRate.upsert({
      where: { date_base_quote: { date, base: ANCHOR, quote } },
      create: { date, base: ANCHOR, quote, rate },
      update: { rate },
    })
    written++
  }

  return written
}

// Load the most recent USD-anchored rate map at or before `on`. Returns a map
// of currency → units per 1 USD. Empty if no rates have been fetched yet.
async function loadAnchorRates(on: Date): Promise<Map<Currency, number>> {
  const date = startOfUtcDay(on)
  const rows = await prisma.fxRate.findMany({
    where: { base: ANCHOR, date: { lte: date } },
    orderBy: { date: "desc" },
  })

  // rows are newest-first; keep the first (latest ≤ on) value seen per quote.
  const map = new Map<Currency, number>()
  for (const r of rows) {
    if (!map.has(r.quote)) map.set(r.quote, Number(r.rate))
  }
  map.set(ANCHOR, 1)
  return map
}

/**
 * Resolve the exchange rate from `from` → `to` (units of `to` per 1 unit of
 * `from`) using the latest stored rates at or before `on`. Returns 1 for
 * same-currency. Returns null when rates are unavailable for either side, so
 * callers can decide how to degrade rather than silently using a wrong number.
 */
export async function getFxRate(
  from: Currency,
  to: Currency,
  on: Date = new Date(),
): Promise<number | null> {
  if (from === to) return 1
  const rates = await loadAnchorRates(on)
  const f = rates.get(from)
  const t = rates.get(to)
  if (!f || !t) return null
  return t / f
}
