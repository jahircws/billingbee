"use server"

import Anthropic from "@anthropic-ai/sdk"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/db"

const anthropic = new Anthropic()

// Simple in-memory per-org rate limiter (10 AI drafts/hour)
const draftCalls = new Map<string, { count: number; resetAt: number }>()
const DRAFT_LIMIT = 10
const DRAFT_WINDOW_MS = 60 * 60 * 1000

function checkDraftRateLimit(orgId: string): boolean {
  const now = Date.now()
  const entry = draftCalls.get(orgId)
  if (!entry || now > entry.resetAt) {
    draftCalls.set(orgId, { count: 1, resetAt: now + DRAFT_WINDOW_MS })
    return true
  }
  if (entry.count >= DRAFT_LIMIT) return false
  entry.count++
  return true
}

// ── generateContractContent ────────────────────────────────────────────────────

export async function generateContractContent(data: {
  clientName: string
  scope: string
  deliverables: string
  amount: number
  currency: "INR" | "USD" | "GBP" | "EUR" | "AED" | string
  timeline: string
  orgName: string
  governingLaw?: string
}): Promise<{ content: string } | { error: string }> {
  try {
    const session = await auth()
    if (!session?.user?.orgId) redirect("/login")
    const orgId = session.user.orgId

    if (!checkDraftRateLimit(orgId)) {
      return { error: "Rate limit reached. You can generate up to 10 AI contracts per hour." }
    }

    const currencySymbol = data.currency === "INR" ? "₹" : data.currency === "USD" ? "$" : data.currency
    const amountFormatted = `${currencySymbol}${Number(data.amount).toLocaleString("en-IN")}`

    const userMessage = `
Freelancer/Agency name: ${data.orgName}
Client name: ${data.clientName}
Scope of work: ${data.scope}
Deliverables: ${data.deliverables}
Project timeline: ${data.timeline}
Total payment amount: ${amountFormatted} (${data.currency})
${data.governingLaw ? `Governing law: ${data.governingLaw}` : ""}
`.trim()

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1200,
      system: `You are a contract drafting assistant for Indian freelancers.
Write professional freelance contracts in plain Markdown.
Always include these sections:
1. Parties (freelancer and client names)
2. Scope of Work
3. Deliverables
4. Timeline
5. Payment Terms (with the exact amount provided; specify 50% upfront, 50% on delivery unless told otherwise)
6. Revision Policy (maximum 2 rounds of revisions included)
7. Intellectual Property (work-for-hire: all IP transfers to client upon receipt of full payment)
8. Confidentiality (one paragraph)
9. Governing Law (use the governingLaw value from context if provided, otherwise default to Laws of India; disputes subject to courts in the applicable jurisdiction)
10. Signature Block (two columns: freelancer and client, with name/date fields)

Keep the total contract under 600 words. Use the real values provided — no placeholders like [INSERT]. Write in plain, professional English.`,
      messages: [{ role: "user", content: userMessage }],
    })

    const content = message.content[0]?.type === "text" ? message.content[0].text : ""
    if (!content) return { error: "AI returned an empty response. Please try again." }

    // Log usage
    await prisma.aIUsageLog.create({
      data: {
        orgId,
        type: "generate",
        model: "claude-haiku-4-5",
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    }).catch(() => {}) // non-fatal

    return { content }
  } catch (err) {
    console.error("generateContractContent:", err)
    return { error: "Failed to generate contract. Please try again." }
  }
}
