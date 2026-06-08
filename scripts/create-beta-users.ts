/**
 * BillingBee v2.0 — Beta User Seeder
 *
 * Creates 10 beta accounts with realistic data for QA/beta testing.
 *
 * Usage:
 *   npm run beta:seed
 *   npm run beta:seed -- --dry-run
 *
 * Each account gets:
 *   - 1 Org + 1 User (OWNER) + default taxes/categories
 *   - 5 clients
 *   - 10 invoices (mix: 4 PAID, 2 UNPAID, 2 OVERDUE, 2 DRAFT)
 *   - 2 overdue invoices → triggers collections agent
 *   - 1 proposal + 1 contract → tests pipeline
 */

import { PrismaClient } from "../lib/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { hash } from "bcryptjs"
import { addDays, subDays } from "date-fns"

// ── Config ──���─────────────────────���───────────────────────────────────────────

const BASE_EMAIL = process.env.BETA_BASE_EMAIL || "beta@billingbee.co"
const BETA_PASSWORD = process.env.BETA_PASSWORD || "BetaTest2025!"
const DRY_RUN = process.argv.includes("--dry-run")
const NUM_ACCOUNTS = 10

const DB_URL =
  process.env.DATABASE_URL ??
  (() => { throw new Error("DATABASE_URL not set") })()

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: DB_URL }),
})

// ── ANSI helpers ───────────────���─────────────────────────���────────────────────

const G = "\x1b[32m", Y = "\x1b[33m", C = "\x1b[36m", B = "\x1b[1m", R = "\x1b[0m"
const ok = (s: string) => console.log(`${G}  ✓ ${s}${R}`)
const info = (s: string) => console.log(`${C}    ${s}${R}`)
const dry = (s: string) => console.log(`${Y}  [DRY] ${s}${R}`)

// ── Seed data ────────��────────────────────────────────────────────────────────

const BETA_ORGS = [
  "Acme Consulting",
  "Pixel Studio",
  "DevCraft Labs",
  "Bright Marketing",
  "SkyLaw Partners",
  "Ironforge Tech",
  "Bloom Design",
  "Rapid Builders",
  "CodeNest Agency",
  "Zenith Advisors",
]

const CLIENT_NAMES = [
  ["TechCorp India", "Startup Hub", "Global Exports Ltd", "Maven Solutions", "CloudBase Inc"],
  ["FintechPay", "RetailX", "GreenEnergy Co", "DataBridge", "NanoSoft"],
  ["MediaPulse", "CityLogistics", "AgroTech", "HealthFirst", "EduSpark"],
  ["SportSync", "TravelWise", "HomeCraft", "LegalEdge", "BioTrack"],
  ["AutoScale", "PrintHouse", "SocialBox", "CleanSlate", "VaultSec"],
  ["NexaDigital", "PrimeFoods", "BuildRight", "WealthPath", "EduNation"],
  ["ArtiCore", "TeleConnect", "SwiftDeliver", "BlueSky Apps", "PureFlow"],
  ["ConstructX", "MetroFinance", "AquaLogic", "SolarMind", "ProPulse"],
  ["CodePeak", "InnoVentures", "RuralCraft", "SmartHire", "DataSync"],
  ["ZenithCo", "UrbanFrame", "LeadBridge", "SkyGrowth", "PeakForm"],
]

const SERVICE_ITEMS = [
  { description: "Web Development — Month 1", amount: 75000 },
  { description: "UI/UX Design Services", amount: 45000 },
  { description: "Digital Marketing Campaign", amount: 30000 },
  { description: "SEO Audit & Optimization", amount: 25000 },
  { description: "Brand Identity Package", amount: 55000 },
  { description: "Mobile App Development", amount: 120000 },
  { description: "Content Writing (10 articles)", amount: 18000 },
  { description: "Social Media Management", amount: 22000 },
  { description: "Video Production", amount: 40000 },
  { description: "Data Analytics Dashboard", amount: 65000 },
]

// ── Invoice factory ───────────────────────────────────────────────────────────

function makeInvoices(orgId: string, clientIds: string[], invIndex: { n: number }) {
  const statuses: Array<"PAID" | "UNPAID" | "OVERDUE" | "DRAFT"> = [
    "PAID", "PAID", "PAID", "PAID",
    "UNPAID", "UNPAID",
    "OVERDUE", "OVERDUE",
    "DRAFT", "DRAFT",
  ]

  return statuses.map((status, i) => {
    const item = SERVICE_ITEMS[i % SERVICE_ITEMS.length]
    const taxRate = [0, 5, 12, 18][i % 4]
    const taxAmount = item.amount * (taxRate / 100)
    const total = item.amount + taxAmount
    const daysAgo = status === "OVERDUE" ? 30 + i * 5 : status === "PAID" ? 45 + i * 7 : 3
    const issueDate = subDays(new Date(), daysAgo)
    const dueDate = status === "OVERDUE" ? subDays(new Date(), 10) : addDays(issueDate, 30)
    invIndex.n++

    return {
      orgId,
      clientId: clientIds[i % clientIds.length],
      invoiceNumber: `INV-${String(invIndex.n).padStart(3, "0")}`,
      status,
      issueDate,
      dueDate,
      currency: "INR" as const,
      subtotal: item.amount,
      taxAmount,
      discountAmount: 0,
      total,
      amountPaid: status === "PAID" ? total : 0,
      amountDue: status === "PAID" ? 0 : total,
      autoFollowUp: status === "OVERDUE",
      items: {
        create: [{
          description: item.description,
          quantity: 1,
          unitPrice: item.amount,
          taxRate,
          taxAmount,
          discount: 0,
          total,
          sortOrder: 0,
        }],
      },
    }
  })
}

// ── Main ────────────────────────────────────────────��─────────────────────────

async function main() {
  console.log(`\n${B}══════════════════════════════════════════${R}`)
  console.log(`${B}  BillingBee — Beta User Seeder${DRY_RUN ? " [DRY RUN]" : ""}${R}`)
  console.log(`${B}═════════���════════════════════════════════${R}\n`)

  const passwordHash = DRY_RUN ? "HASH_PLACEHOLDER" : await hash(BETA_PASSWORD, 12)

  // Parse base email: beta@billingbee.co → beta+N@billingbee.co
  const [localPart, domain] = BASE_EMAIL.split("@")
  const invIndex = { n: 0 }

  for (let i = 1; i <= NUM_ACCOUNTS; i++) {
    const email = `${localPart}+${i}@${domain}`
    const orgName = BETA_ORGS[i - 1]
    const clientNames = CLIENT_NAMES[i - 1]

    if (DRY_RUN) {
      dry(`Account ${i}: ${email} — Org: "${orgName}"`)
      dry(`  5 clients, 10 invoices (4 PAID, 2 UNPAID, 2 OVERDUE, 2 DRAFT)`)
      dry(`  1 proposal + 1 contract`)
      continue
    }

    // Skip if already exists
    const exists = await db.user.findUnique({ where: { email } })
    if (exists) {
      info(`Skipping ${email} (already exists)`)
      continue
    }

    const orgSlug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-")

    // Org + User + OrgUser
    const org = await db.organization.create({
      data: {
        name: orgName,
        slug: orgSlug,
        email,
        plan: "pro",
        planExpiry: addDays(new Date(), 90),
        acquisitionSource: "beta_seed",
      },
    })

    const user = await db.user.create({
      data: { email, name: `Beta User ${i}`, passwordHash },
    })

    await db.orgUser.create({
      data: { orgId: org.id, userId: user.id, role: "OWNER" },
    })

    // Default taxes + categories
    await db.tax.createMany({
      data: [
        { orgId: org.id, name: "GST 18%", rate: 18, isDefault: true },
        { orgId: org.id, name: "GST 12%", rate: 12, isDefault: false },
        { orgId: org.id, name: "GST 5%", rate: 5, isDefault: false },
        { orgId: org.id, name: "No Tax", rate: 0, isDefault: false },
      ],
    })

    await db.category.createMany({
      data: [
        { orgId: org.id, name: "Services", color: "#059669" },
        { orgId: org.id, name: "Products", color: "#3b82f6" },
        { orgId: org.id, name: "Consulting", color: "#8b5cf6" },
        { orgId: org.id, name: "Expenses", color: "#f59e0b" },
      ],
    })

    // 5 Clients
    const clients = await Promise.all(
      clientNames.map((name, ci) =>
        db.client.create({
          data: {
            orgId: org.id,
            name,
            email: `accounts@${name.toLowerCase().replace(/\s+/g, "")}.com`,
            company: name,
            gstin: ci % 2 === 0 ? `29AABCS${1234 + ci}K1Z5` : undefined, // some with GSTIN
            country: "IN",
          },
        })
      )
    )

    const clientIds = clients.map((c) => c.id)

    // 10 Invoices (4 PAID, 2 UNPAID, 2 OVERDUE, 2 DRAFT)
    const invoiceData = makeInvoices(org.id, clientIds, invIndex)
    for (const inv of invoiceData) {
      await db.invoice.create({ data: inv })
    }

    // 1 Proposal
    const proposal = await db.proposal.create({
      data: {
        orgId: org.id,
        clientId: clientIds[0],
        title: `Website Redesign Proposal — ${clientNames[0]}`,
        status: "ACCEPTED",
        sections: [
          { title: "Overview", content: "Full website redesign with modern UI/UX." },
          { title: "Deliverables", content: "5 pages, responsive design, CMS integration." },
          { title: "Timeline", content: "6 weeks from kickoff." },
        ],
        pricing: { total: 150000, currency: "INR" },
        acceptedAt: subDays(new Date(), 5),
      },
    })

    // 1 Contract
    await db.contract.create({
      data: {
        orgId: org.id,
        clientId: clientIds[0],
        proposalId: proposal.id,
        title: `Service Agreement — ${orgName} x ${clientNames[0]}`,
        status: "SIGNED",
        content: `This agreement is between ${orgName} ("Service Provider") and ${clientNames[0]} ("Client").\n\nScope: Website redesign as outlined in the accepted proposal.\nPayment: ₹1,50,000 payable in 3 milestones.\nTimeline: 6 weeks from the date of signing.\n\nSigned electronically by both parties.`,
        signedAt: subDays(new Date(), 3),
        signedBy: `${clientNames[0]} Representative`,
      },
    })

    ok(`Account ${i}: ${email} (${org.id.slice(-6)}) — 5 clients, 10 invoices, 1 proposal, 1 contract`)
  }

  if (DRY_RUN) {
    console.log(`\n${Y}${B}DRY RUN COMPLETE — would create ${NUM_ACCOUNTS} accounts${R}`)
    console.log(`  ${NUM_ACCOUNTS * 5} clients, ${NUM_ACCOUNTS * 10} invoices`)
    console.log(`  ${NUM_ACCOUNTS} proposals, ${NUM_ACCOUNTS} contracts`)
    console.log(`\nRun without --dry-run to seed for real.`)
    return
  }

  console.log(`\n${G}${B}Beta seeding complete!${R}`)
  console.log(`  Accounts: ${NUM_ACCOUNTS}`)
  console.log(`  Password: ${BETA_PASSWORD}`)
  console.log(`  Emails:   ${localPart}+1@${domain} … ${localPart}+${NUM_ACCOUNTS}@${domain}`)
}

main()
  .catch((e) => {
    console.error(`\x1b[31mFATAL: ${e instanceof Error ? e.message : String(e)}\x1b[0m`)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
