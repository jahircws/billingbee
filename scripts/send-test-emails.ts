/**
 * BillingBee v2.0 — Relaunch Email Test Sender
 *
 * Sends all 3 relaunch email variants to a single test address.
 * DO NOT run this script to send to real users.
 *
 * Usage:
 *   npx ts-node --project tsconfig.scripts.json scripts/send-test-emails.ts
 *
 * Or with a custom test address:
 *   TEST_EMAIL=you@example.com npx ts-node --project tsconfig.scripts.json scripts/send-test-emails.ts
 *
 * Required env vars:
 *   RESEND_API_KEY
 *   TEST_EMAIL  (optional, defaults to amit+test@billingbee.co)
 */

import {
  sendRelaunchiSegmentA,
  sendRelaunchSegmentB,
  sendRelaunchSegmentC,
} from "../lib/email"

const TEST_EMAIL = process.env.TEST_EMAIL ?? "amit+test@billingbee.co"

// ── UTM-tagged test URLs ───────────────────────────────────────────────────────

const TEST_LOGIN_A = `https://billingbee.co/login?email=${encodeURIComponent(TEST_EMAIL)}&utm_source=relaunch&utm_campaign=segment-a&utm_medium=email`
const TEST_LOGIN_B = `https://billingbee.co/login?email=${encodeURIComponent(TEST_EMAIL)}&utm_source=relaunch&utm_campaign=segment-b&utm_medium=email`
const TEST_GENERATE_C = `https://billingbee.co/generate?utm_source=relaunch&utm_campaign=segment-c&utm_medium=email`

// ── Verification checklist ────────────────────────────────────────────────────

function checklist(name: string, result: { id?: string; error?: string }) {
  if (result.error) {
    console.error(`  ❌  ${name}: FAILED — ${result.error}`)
    return false
  }
  console.log(`  ✅  ${name}: sent (id: ${result.id})`)
  return true
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.RESEND_API_KEY) {
    console.error("❌  RESEND_API_KEY is not set")
    process.exit(1)
  }

  console.log("\n🧪  BillingBee — Relaunch Email Test Send")
  console.log(`   Sending all 3 variants to: ${TEST_EMAIL}`)
  console.log(`   These are test sends. DO NOT use this to blast real users.\n`)

  let allPassed = true

  // ── Segment A ────────────────────────────────────────────────────────────────

  console.log("📧  Segment A — Verified users (3 months Pro free)")
  const resA = await sendRelaunchiSegmentA("Amit", TEST_EMAIL, TEST_LOGIN_A)
  if (!checklist("Segment A email", resA)) allPassed = false

  // Small delay between sends to avoid Resend rate limits
  await new Promise((r) => setTimeout(r, 1000))

  // ── Segment B ────────────────────────────────────────────────────────────────

  console.log("\n📧  Segment B — Inactive users (60 days Pro free)")
  const resB = await sendRelaunchSegmentB("Amit", TEST_EMAIL, TEST_LOGIN_B)
  if (!checklist("Segment B email", resB)) allPassed = false

  await new Promise((r) => setTimeout(r, 1000))

  // ── Segment C ────────────────────────────────────────────────────────────────

  console.log("\n📧  Segment C — Unverified / cold (no-signup CTA)")
  const resC = await sendRelaunchSegmentC(TEST_EMAIL, TEST_GENERATE_C)
  if (!checklist("Segment C email", resC)) allPassed = false

  // ── Review checklist ──────────────────────────────────────────────────────────

  console.log(`\n${"─".repeat(60)}`)
  if (allPassed) {
    console.log(`✅  All 3 test emails sent to ${TEST_EMAIL}`)
  } else {
    console.log(`❌  Some emails failed — fix errors before proceeding`)
    process.exit(1)
  }

  console.log(`\n📋  Manual review checklist (check your inbox):`)
  console.log(``)
  console.log(`   Segment A — "We rebuilt BillingBee from scratch"`)
  console.log(`   □ From: Amit from BillingBee <amit@billingbee.co>`)
  console.log(`   □ Subject correct`)
  console.log(`   □ Preview text: "The old version wasn't good enough. Here's what's new."`)
  console.log(`   □ First name personalisation works ("Hey Amit,")`)
  console.log(`   □ "→ Log in and try it" button links to correct URL with UTMs`)
  console.log(`   □ Mobile rendering OK`)
  console.log(`   □ Unsubscribe link present in footer`)
  console.log(``)
  console.log(`   Segment B — "Your BillingBee account is back"`)
  console.log(`   □ From: BillingBee <hello@billingbee.co>`)
  console.log(`   □ Subject correct`)
  console.log(`   □ Preview text: "We've completely rebuilt the product. 60 days Pro free."`)
  console.log(`   □ "→ Reactivate your account" button links correctly`)
  console.log(`   □ Mobile rendering OK`)
  console.log(`   □ Unsubscribe link present`)
  console.log(``)
  console.log(`   Segment C — "Create your first invoice in 60 seconds"`)
  console.log(`   □ From: BillingBee <hello@billingbee.co>`)
  console.log(`   □ Subject correct`)
  console.log(`   □ Preview text: "Upload a screenshot → get an invoice. No account needed."`)
  console.log(`   □ "→ Try it at billingbee.co/generate" button links correctly`)
  console.log(`   □ Mobile rendering OK`)
  console.log(`   □ Unsubscribe link present`)
  console.log(``)
  console.log(`   UTM verification — paste each URL into GA4 Campaign URL builder and confirm:`)
  console.log(`   □ utm_source=relaunch`)
  console.log(`   □ utm_campaign=segment-a (or b or c)`)
  console.log(`   □ utm_medium=email`)
  console.log(`${"─".repeat(60)}\n`)
}

main().catch((e) => {
  console.error("Fatal error:", e)
  process.exit(1)
})
