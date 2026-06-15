"use server"

import { randomBytes } from "crypto"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { serialize } from "@/lib/serialize"
import { sanitizeInput } from "@/lib/sanitize"
import { getActivePlan } from "@/lib/plan"
import { sendContractEmail, sendEmail } from "@/lib/email"
import { format } from "date-fns"

// Prisma client doesn't know about new Contract fields until `prisma generate`
// runs after `prisma db push`. All casts below remove themselves after that.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

// ── helpers ───────────────────────────────────────────────────────────────────

async function getOrgIdOrRedirect(): Promise<string> {
  const session = await auth()
  if (!session?.user?.orgId) redirect("/login")
  return session.user.orgId
}

// ── getContracts ───────────────────────────────────────────────────────────────

export async function getContracts(filters?: {
  status?: string
  clientId?: string
  search?: string
}) {
  try {
    const orgId = await getOrgIdOrRedirect()

    const where: Record<string, unknown> = { orgId }
    if (filters?.status) where.status = filters.status
    if (filters?.clientId) where.clientId = filters.clientId
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { client: { name: { contains: filters.search, mode: "insensitive" } } },
      ]
    }

    const contracts = await prisma.contract.findMany({
      where,
      include: { client: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return { contracts: contracts.map(serialize) }
  } catch (err) {
    console.error("getContracts:", err)
    return { error: "Failed to load contracts" }
  }
}

// ── getContract ────────────────────────────────────────────────────────────────

export async function getContract(contractId: string) {
  try {
    const orgId = await getOrgIdOrRedirect()

    const contract = await prisma.contract.findFirst({
      where: { id: contractId, orgId },
      include: {
        client: true,
        proposal: { select: { id: true, title: true, pricing: true } },
      },
    })

    if (!contract) return { error: "Contract not found" }
    return { contract: serialize(contract) }
  } catch (err) {
    console.error("getContract:", err)
    return { error: "Failed to load contract" }
  }
}

// ── createContract ─────────────────────────────────────────────────────────────

export async function createContract(data: {
  clientId: string
  title: string
  content: string
  proposalId?: string
}) {
  try {
    const orgId = await getOrgIdOrRedirect()

    // Plan gate: free plan allows 3 contracts/month
    const plan = await getActivePlan(orgId)
    if (plan === "free") {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const count = await prisma.contract.count({
        where: { orgId, createdAt: { gte: startOfMonth } },
      })
      if (count >= 3) {
        return { error: "Free plan allows 3 contracts per month. Upgrade to Pro for unlimited contracts." }
      }
    }

    const contract = await prisma.contract.create({
      data: {
        orgId,
        clientId: data.clientId,
        title: sanitizeInput(data.title),
        content: sanitizeInput(data.content),
        ...(data.proposalId ? { proposalId: data.proposalId } : {}),
      },
    })

    return { contract: serialize(contract) }
  } catch (err) {
    console.error("createContract:", err)
    return { error: "Failed to create contract" }
  }
}

// ── updateContract ─────────────────────────────────────────────────────────────

export async function updateContract(
  contractId: string,
  data: { title?: string; content?: string },
) {
  try {
    const orgId = await getOrgIdOrRedirect()

    const existing = await prisma.contract.findFirst({
      where: { id: contractId, orgId },
    })
    if (!existing) return { error: "Contract not found" }

    const contract = await prisma.contract.update({
      where: { id: contractId },
      data: {
        ...(data.title !== undefined ? { title: sanitizeInput(data.title) } : {}),
        ...(data.content !== undefined ? { content: sanitizeInput(data.content) } : {}),
      },
    })

    return { contract: serialize(contract) }
  } catch (err) {
    console.error("updateContract:", err)
    return { error: "Failed to update contract" }
  }
}

// ── deleteContract ─────────────────────────────────────────────────────────────

export async function deleteContract(contractId: string) {
  try {
    const orgId = await getOrgIdOrRedirect()

    const existing = await prisma.contract.findFirst({
      where: { id: contractId, orgId },
    })
    if (!existing) return { error: "Contract not found" }
    if (existing.status !== "DRAFT") {
      return { error: "Cannot delete a sent contract. Only draft contracts can be deleted." }
    }

    await prisma.contract.delete({ where: { id: contractId } })
    return { success: true }
  } catch (err) {
    console.error("deleteContract:", err)
    return { error: "Failed to delete contract" }
  }
}

// ── sendContract ───────────────────────────────────────────────────────────────

export async function sendContract(contractId: string) {
  try {
    const orgId = await getOrgIdOrRedirect()

    const contract = await db.contract.findFirst({
      where: { id: contractId, orgId },
      include: {
        client: { select: { name: true, email: true } },
        org: { select: { name: true } },
      },
    })
    if (!contract) return { error: "Contract not found" }
    if (!contract.client.email) return { error: "Client has no email address" }

    const token = randomBytes(32).toString("hex")
    const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "https://billingbee.co"
    const portalUrl = `${base}/portal/contract/${token}`

    await db.contract.update({
      where: { id: contractId },
      data: { token, sentAt: new Date(), status: "SENT" },
    })

    await sendContractEmail(
      contract.client.name,
      contract.client.email,
      contract.org.name,
      contract.title,
      portalUrl,
    )

    return { success: true }
  } catch (err) {
    console.error("sendContract:", err)
    return { error: "Failed to send contract" }
  }
}

// ── signContractWithProof ──────────────────────────────────────────────────────

export async function signContractWithProof(
  token: string,
  data: {
    signedBy: string
    signatureData: string
  },
) {
  try {
    const headersList = await headers()
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      ""
    const userAgent = headersList.get("user-agent") ?? ""

    const contract = await db.contract.findUnique({
      where: { token },
      include: {
        client: { select: { name: true } },
        org: {
          select: {
            name: true,
            orgUsers: {
              where: { role: "OWNER" },
              include: { user: { select: { email: true } } },
              take: 1,
            },
          },
        },
      },
    })

    if (!contract) return { error: "Invalid or expired link" }

    // Check expiry: sentAt + 30 days
    if (contract.sentAt) {
      const expiresAt = new Date(contract.sentAt)
      expiresAt.setDate(expiresAt.getDate() + 30)
      if (new Date() > expiresAt) {
        return { error: "This signing link has expired. Please ask for a new one." }
      }
    }

    if (contract.status === "SIGNED") return { error: "This contract has already been signed." }
    if (contract.status !== "SENT") return { error: "This contract is not ready for signing." }

    const signedAt = new Date()

    await db.contract.update({
      where: { id: contract.id },
      data: {
        status: "SIGNED",
        signedAt,
        signedBy: sanitizeInput(data.signedBy),
        signatureData: sanitizeInput(data.signatureData),
        ipAddress,
        userAgent,
      },
    })

    revalidatePath("/dashboard")

    // Notify org owner
    const ownerEmail = contract.org.orgUsers[0]?.user?.email
    if (ownerEmail) {
      const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "https://billingbee.co"
      const contractLink = `${base}/contracts/${contract.id}`
      const signedAtStr = format(signedAt, "d MMMM yyyy, h:mm a")
      const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
<tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td style="background:#059669;border-radius:12px 12px 0 0;padding:24px 32px;">
  <span style="color:#fff;font-size:20px;font-weight:800;">BillingBee</span>
</td></tr>
<tr><td style="background:#fff;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;">
  <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;">Contract signed ✅</h1>
  <p style="margin:0 0 14px;font-size:15px;color:#374151;line-height:1.6;">
    <strong>${contract.client.name}</strong> signed &ldquo;<strong>${contract.title}</strong>&rdquo;.
  </p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
  <table cellpadding="0" cellspacing="0" width="100%" style="font-size:14px;">
    <tr>
      <td style="padding:6px 0;color:#6b7280;">Signed by</td>
      <td style="padding:6px 0;font-weight:600;color:#111827;text-align:right;">${data.signedBy}</td>
    </tr>
    <tr>
      <td style="padding:6px 0;color:#6b7280;">Date &amp; time</td>
      <td style="padding:6px 0;color:#374151;text-align:right;">${signedAtStr}</td>
    </tr>
    <tr>
      <td style="padding:6px 0;color:#6b7280;">IP address</td>
      <td style="padding:6px 0;color:#374151;text-align:right;">${ipAddress || "—"}</td>
    </tr>
  </table>
  <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr><td style="background:#059669;border-radius:8px;">
      <a href="${contractLink}" style="display:inline-block;color:#fff;font-size:15px;font-weight:600;padding:12px 28px;text-decoration:none;">View signed contract →</a>
    </td></tr>
  </table>
</td></tr>
</table></td></tr>
</table>
</body></html>`

      await sendEmail({
        to: ownerEmail,
        subject: `✅ ${contract.client.name} signed: ${contract.title}`,
        html,
      })
    }

    return { success: true }
  } catch (err) {
    console.error("signContractWithProof:", err)
    return { error: "Failed to sign contract. Please try again." }
  }
}

// ── getContractByToken ─────────────────────────────────────────────────────────

export async function getContractByToken(token: string) {
  try {
    const contract = await db.contract.findUnique({
      where: { token },
      include: {
        client: { select: { name: true } },
        org: { select: { name: true } },
      },
    })

    if (!contract) return null

    // Check expiry
    if (contract.sentAt) {
      const expiresAt = new Date(contract.sentAt)
      expiresAt.setDate(expiresAt.getDate() + 30)
      if (new Date() > expiresAt) return null
    }

    // Never return token or internal IDs
    return {
      id: contract.id,
      title: contract.title,
      content: contract.content,
      status: contract.status as string,
      signedAt: contract.signedAt as Date | null,
      signedBy: contract.signedBy as string | null,
      clientName: contract.client.name,
      orgName: contract.org.name,
    }
  } catch (err) {
    console.error("getContractByToken:", err)
    return null
  }
}

// ── markContractViewed ─────────────────────────────────────────────────────────

export async function markContractViewed(token: string) {
  try {
    const contract = await db.contract.findUnique({
      where: { token },
      select: { id: true, viewedAt: true, status: true },
    })
    if (!contract || contract.viewedAt || contract.status !== "SENT") return
    await db.contract.update({
      where: { id: contract.id },
      data: { viewedAt: new Date() },
    })
  } catch {
    // Fire-and-forget — never block page render
  }
}

// ── signContract (session-based — backward compat with portal SignContractButton)

export async function signContract(contractId: string) {
  try {
    const session = await auth()
    if (!session?.user) redirect("/login")

    const headersList = await headers()
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      null

    if (session.user.userType === "CLIENT") {
      const clientId = session.user.clientId
      if (!clientId) redirect("/login")

      const contract = await db.contract.update({
        where: { id: contractId, clientId },
        data: {
          status: "SIGNED",
          signedAt: new Date(),
          signedBy: session.user.name ?? session.user.email ?? "Client",
          signatureData: `typed:${session.user.name ?? session.user.email ?? "Client"}`,
          ipAddress: ip,
        },
      })
      revalidatePath("/dashboard")
      return { contract: serialize(contract) }
    }

    const orgId = session.user.orgId
    if (!orgId) redirect("/login")

    const contract = await db.contract.update({
      where: { id: contractId, orgId },
      data: {
        status: "SIGNED",
        signedAt: new Date(),
        signedBy: session.user.name ?? session.user.email ?? "Staff",
        signatureData: `typed:${session.user.name ?? session.user.email ?? "Staff"}`,
        ipAddress: ip,
      },
    })
    revalidatePath("/dashboard")
    return { contract: serialize(contract) }
  } catch (err) {
    console.error("signContract:", err)
    return { error: "Failed to sign contract" }
  }
}
