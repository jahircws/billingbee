"use server"

import { redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { serialize } from "@/lib/serialize"
import Anthropic from "@anthropic-ai/sdk"
import { sendProposalEmail } from "@/lib/email"

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
    include: { client: true },
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
  const proposalUrl = `${base}/portal/${orgSlug}/proposal/${proposalId}`

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
  })
  if (!proposal) return { error: "Proposal not found" }
  if (proposal.status !== "SENT") return { error: "This proposal is no longer open for response" }

  const updated = await prisma.proposal.update({
    where: { id: proposalId },
    data: { status: response },
  })
  return { proposal: serialize(updated) }
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

export async function signContract(contractId: string) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  const contract = await prisma.contract.update({
    where: { id: contractId, orgId },
    data: {
      status: "SIGNED",
      signedAt: new Date(),
      signedBy: session.user.name ?? session.user.email ?? "Staff",
    },
  })
  return { contract: serialize(contract) }
}
