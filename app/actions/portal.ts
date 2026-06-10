"use server"

import { redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { sendPortalInviteEmail } from "@/lib/email"
import { randomBytes } from "crypto"
import { hash } from "bcryptjs"
import { addDays } from "date-fns"

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export async function inviteClient(clientId: string) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  const client = await prisma.client.findUnique({
    where: { id: clientId, orgId },
    include: { org: { select: { slug: true, name: true } } },
  })
  if (!client?.email) return { error: "Client has no email address" }

  // Ensure client has a slug
  if (!client.slug) {
    const base = slugify(client.name)
    let slug = base
    let i = 1
    while (await prisma.client.findFirst({ where: { orgId, slug } })) {
      slug = `${base}-${i++}`
    }
    await prisma.client.update({ where: { id: clientId }, data: { slug } })
  }

  const token = randomBytes(32).toString("hex")
  const expiresAt = addDays(new Date(), 7)

  await prisma.clientPortalUser.create({
    data: {
      clientId,
      email: client.email,
      token,
      expiresAt,
    },
  })

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://billingbee.co"
  const inviteUrl = `${base}/portal/${client.org.slug}/accept?token=${token}`

  await sendPortalInviteEmail(client.name, client.email, client.org.name, inviteUrl)

  return { success: true }
}

export async function acceptPortalInvite(token: string, password: string) {
  const portalUser = await prisma.clientPortalUser.findUnique({
    where: { token },
    include: { client: { include: { org: true } } },
  })

  if (!portalUser) return { error: "Invalid or expired invite link" }
  if (portalUser.expiresAt < new Date()) return { error: "This invite link has expired" }

  const passwordHash = await hash(password, 12)
  await prisma.clientPortalUser.update({
    where: { token },
    data: { passwordHash, usedAt: new Date() },
  })

  return {
    success: true,
    email: portalUser.email,
    orgSlug: portalUser.client.org.slug,
    clientSlug: portalUser.client.slug,
  }
}
