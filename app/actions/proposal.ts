"use server"

import { redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { serialize } from "@/lib/serialize"
import Anthropic from "@anthropic-ai/sdk"
import { sendProposalEmail, sendContractEmail } from "@/lib/email"
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
    include: { client: { include: { org: { select: { slug: true, name: true } } } } },
  })
  if (!proposal) return { error: "Proposal not found" }
  if (proposal.status !== "SENT") return { error: "This proposal is no longer open for response" }

  const updated = await prisma.proposal.update({
    where: { id: proposalId },
    data: { status: response, ...(response === "ACCEPTED" ? { acceptedAt: new Date() } : { rejectedAt: new Date() }) },
  })

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

      const contract = await prisma.contract.create({
        data: {
          orgId: proposal.orgId,
          clientId: proposal.clientId,
          proposalId: proposal.id,
          title: `Contract — ${proposal.title}`,
          content,
          status: "SENT",
        },
      })

      // Email client the contract link
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
    } catch {
      // Auto-contract generation failing should not block the acceptance response
    }
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

// Moved to app/actions/contract.ts — re-exported here for any callers that import from proposal
export { signContract } from "@/app/actions/contract"
