"use server"

import { randomBytes } from "crypto"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { serialize } from "@/lib/serialize"
import Anthropic from "@anthropic-ai/sdk"
import { sendProposalEmail, sendContractEmail, sendEmail } from "@/lib/email"
import { SignJWT } from "jose"
import { headers } from "next/headers"

const anthropic = new Anthropic()

interface Section { title: string; content: string }
interface ProposalData {
  title: string
  clientId: string
  aiPrompt?: string
  sections?: Section[]
  pricing?: unknown
  timeline?: string
}

export async function getProposals() {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  return prisma.proposal.findMany({
    where: { orgId },
    include: { client: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })
}

export async function getProposal(proposalId: string) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  return prisma.proposal.findUnique({
    where: { id: proposalId, orgId },
    include: { client: true, contract: true },
  })
}

export async function generateProposal(clientId: string, prompt: string) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  const [client, recentInvoices] = await Promise.all([
    prisma.client.findUnique({ where: { id: clientId, orgId } }),
    prisma.invoice.findMany({
      where: { orgId, clientId },
      include: { items: { select: { description: true, total: true } } },
      orderBy: { issueDate: "desc" },
      take: 5,
    }),
  ])

  if (!client) return { error: "Client not found" }

  const history = recentInvoices.map((inv) => {
    const items = inv.items.map((i) => i.description).join(", ")
    return `${inv.invoiceNumber}: ${items} — ₹${Number(inv.total)}`
  }).join("\n")

  const systemPrompt = `You are an expert proposal writer for a professional services business.
Return ONLY valid JSON with no markdown, no code fences, no explanation — just the raw JSON object.
Use this exact format:
{
  "title": "Proposal title",
  "sections": [
    {"title": "Executive Summary", "content": "..."},
    {"title": "Scope of Work", "content": "..."},
    {"title": "Timeline", "content": "..."},
    {"title": "Terms & Conditions", "content": "..."}
  ],
  "pricing": {"description": "...", "total": 0, "currency": "INR"},
  "timeline": "X weeks"
}`

  const userMessage = `Client: ${client.name}
Previous work history: ${history || "No previous work"}
Request: ${prompt}`

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : ""
  let parsed: { title: string; sections: Section[]; pricing: unknown; timeline: string }
  try {
    // Strip markdown code fences if present, then extract JSON object
    const stripped = text.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim()
    const match = stripped.match(/\{[\s\S]*\}/)
    parsed = JSON.parse(match?.[0] ?? stripped)
  } catch {
    return { error: "Failed to parse AI response" }
  }

  const proposal = await prisma.proposal.create({
    data: {
      orgId,
      clientId,
      title: parsed.title ?? `Proposal for ${client.name}`,
      sections: parsed.sections as never,
      pricing: parsed.pricing as never,
      timeline: parsed.timeline,
      aiPrompt: prompt,
    },
  })

  return { proposal: serialize(proposal) }
}

export async function createProposal(data: ProposalData) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  const proposal = await prisma.proposal.create({
    data: {
      orgId,
      clientId: data.clientId,
      title: data.title,
      sections: (data.sections ?? []) as never,
      pricing: data.pricing as never,
      timeline: data.timeline,
      aiPrompt: data.aiPrompt,
    },
  })
  return { proposal: serialize(proposal) }
}

export async function convertToContract(proposalId: string) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId, orgId },
    include: { client: { include: { org: { select: { slug: true, name: true } } } } },
  })
  if (!proposal) return { error: "Proposal not found" }

  const sections = proposal.sections as unknown as Section[]
  const scopeSection = sections.find((s) => s.title.toLowerCase().includes("scope")) ?? sections[0]

  const prompt = `Convert this proposal into a formal legal contract with proper legal language.
Client: ${proposal.client.name}
Proposal title: ${proposal.title}
Scope: ${scopeSection?.content ?? ""}
Timeline: ${proposal.timeline ?? "As agreed"}
Pricing: ${JSON.stringify(proposal.pricing ?? {})}

Write a complete contract with: parties, scope of work, payment terms, timeline, IP rights, confidentiality, termination clause, and signature blocks.`

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 3000,
    messages: [{ role: "user", content: prompt }],
  })

  const content = message.content[0].type === "text" ? message.content[0].text : ""

  const contract = await prisma.contract.create({
    data: {
      orgId,
      clientId: proposal.clientId,
      proposalId: proposal.id,
      title: `Contract — ${proposal.title}`,
      content,
    },
  })

  // Phase 3 — notify client that a contract is ready to sign
  if (proposal.client.email) {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://billingbee.co"
    const orgSlug = proposal.client.org.slug
    const contractUrl = `${base}/portal/${orgSlug}/contract/${contract.id}`
    sendContractEmail(
      proposal.client.name,
      proposal.client.email,
      proposal.client.org.name,
      contract.title,
      contractUrl,
    ).catch(() => {})
  }

  return { contract: serialize(contract) }
}

export async function sendProposalToClient(proposalId: string) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId, orgId },
    include: {
      client: { include: { org: { select: { slug: true, name: true } } } },
    },
  })
  if (!proposal) return { error: "Proposal not found" }
  if (!proposal.client.email) return { error: "Client has no email address. Add one in Clients first." }

  // Mark as SENT
  await prisma.proposal.update({ where: { id: proposalId }, data: { status: "SENT" } })

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://billingbee.co"
  const orgSlug = proposal.client.org.slug

  // Generate a 7-day signed access token so unregistered clients can auto-login
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET ?? "fallback-secret")
  const accessToken = await new SignJWT({
    clientId: proposal.client.id,
    email: proposal.client.email,
    orgSlug,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret)

  const proposalUrl = `${base}/portal/${orgSlug}/open/${proposalId}?t=${accessToken}`

  // Fire-and-forget email
  sendProposalEmail(
    proposal.client.name,
    proposal.client.email,
    proposal.client.org.name,
    proposal.title,
    proposalUrl,
  ).catch(() => {})

  return { success: true }
}

// Called from client portal — no org auth, uses clientId from session
export async function respondToProposal(proposalId: string, response: "ACCEPTED" | "REJECTED") {
  const session = await auth()
  if (!session?.user?.clientId || session.user.userType !== "CLIENT") {
    return { error: "Unauthorized" }
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId, clientId: session.user.clientId },
    include: {
      client: { include: { org: { select: { slug: true, name: true } } } },
      org: {
        select: {
          orgUsers: {
            where: { role: "OWNER" },
            include: { user: { select: { email: true } } },
            take: 1,
          },
        },
      },
    },
  })
  if (!proposal) return { error: "Proposal not found" }
  if (proposal.status !== "SENT") return { error: "This proposal is no longer open for response" }

  const updated = await prisma.proposal.update({
    where: { id: proposalId },
    data: { status: response, ...(response === "ACCEPTED" ? { acceptedAt: new Date() } : { rejectedAt: new Date() }) },
  })

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://billingbee.co"
  const ownerEmail = proposal.org.orgUsers[0]?.user?.email

  // Phase 4 — auto-generate contract + notify client when proposal is accepted
  if (response === "ACCEPTED") {
    try {
      const sections = proposal.sections as unknown as Section[]
      const scopeSection = sections.find((s) => s.title.toLowerCase().includes("scope")) ?? sections[0]

      const aiPrompt = `Convert this proposal into a formal legal contract with proper legal language.
Client: ${proposal.client.name}
Proposal title: ${proposal.title}
Scope: ${scopeSection?.content ?? ""}
Timeline: ${proposal.timeline ?? "As agreed"}
Pricing: ${JSON.stringify(proposal.pricing ?? {})}

Write a complete contract with: parties, scope of work, payment terms, timeline, IP rights, confidentiality, termination clause, and signature blocks.`

      const message = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 3000,
        messages: [{ role: "user", content: aiPrompt }],
      })

      const content = message.content[0].type === "text" ? message.content[0].text : ""

      // Generate a signing token so the client can sign via the token-based URL
      const token = randomBytes(32).toString("hex")

      const contract = await prisma.contract.create({
        data: {
          orgId: proposal.orgId,
          clientId: proposal.clientId,
          proposalId: proposal.id,
          title: `Contract — ${proposal.title}`,
          content,
          status: "SENT",
          token,
          sentAt: new Date(),
        },
      })

      // Email client the correct token-based signing URL
      if (proposal.client.email) {
        const contractUrl = `${base}/portal/contract/${contract.token}`
        sendContractEmail(
          proposal.client.name,
          proposal.client.email,
          proposal.client.org.name,
          contract.title,
          contractUrl,
        ).catch(() => {})
      }
    } catch {
      // Auto-contract generation failing should not block the acceptance response
    }
  }

  // Fix 5 — notify org owner when proposal is declined
  if (response === "REJECTED" && ownerEmail) {
    const proposalLink = `${base}/proposals/${proposalId}`
    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
<tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td style="background:#059669;border-radius:12px 12px 0 0;padding:24px 32px;">
  <span style="color:#fff;font-size:20px;font-weight:800;">BillingBee</span>
</td></tr>
<tr><td style="background:#fff;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;">
  <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;">Proposal declined</h1>
  <p style="margin:0 0 14px;font-size:15px;color:#374151;line-height:1.6;">
    <strong>${proposal.client.name}</strong> declined your proposal: &ldquo;<strong>${proposal.title}</strong>&rdquo;.
  </p>
  <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
    They may have questions or need adjustments. Consider reaching out to understand their concerns and revise if needed.
  </p>
  <table cellpadding="0" cellspacing="0">
    <tr><td style="background:#059669;border-radius:8px;">
      <a href="${proposalLink}" style="display:inline-block;color:#fff;font-size:15px;font-weight:600;padding:12px 28px;text-decoration:none;">View &amp; revise proposal →</a>
    </td></tr>
  </table>
</td></tr>
</table></td></tr>
</table>
</body></html>`
    sendEmail({
      to: ownerEmail,
      subject: `${proposal.client.name} declined your proposal`,
      html,
    }).catch(() => {})
  }

  return { proposal: serialize(updated) }
}

export async function updateProposal(
  proposalId: string,
  data: { title?: string; sections?: Section[]; pricing?: unknown; timeline?: string }
) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  const proposal = await prisma.proposal.update({
    where: { id: proposalId, orgId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.sections !== undefined && { sections: data.sections as never }),
      ...(data.pricing !== undefined && { pricing: data.pricing as never }),
      ...(data.timeline !== undefined && { timeline: data.timeline }),
    },
  })
  return { proposal: serialize(proposal) }
}

export async function deleteProposal(proposalId: string) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  const existing = await prisma.proposal.findUnique({ where: { id: proposalId, orgId } })
  if (!existing) return { error: "Proposal not found" }

  await prisma.proposal.delete({ where: { id: proposalId } })
  return { success: true }
}

export async function updateProposalStatus(proposalId: string, status: string) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  const proposal = await prisma.proposal.update({
    where: { id: proposalId, orgId },
    data: { status: status as never },
  })
  return { proposal: serialize(proposal) }
}

