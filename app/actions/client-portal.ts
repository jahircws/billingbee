"use server"

import { SignJWT } from "jose"
import prisma from "@/lib/db"
import { sendClientMagicLinkEmail } from "@/lib/email"

export async function requestClientMagicLink(orgSlug: string, email: string) {
  const normalizedEmail = email.toLowerCase().trim()

  // Always return success to avoid leaking whether an email exists
  try {
    const org = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true, name: true },
    })
    if (!org) return { success: true }

    const client = await prisma.client.findFirst({
      where: { email: normalizedEmail, orgId: org.id },
      select: { id: true, name: true, email: true },
    })
    if (!client || !client.email) return { success: true }

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET ?? "fallback-secret")
    const accessToken = await new SignJWT({
      clientId: client.id,
      email: normalizedEmail,
      orgSlug,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret)

    const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "https://billingbee.co"
    const accessUrl = `${base}/portal/${orgSlug}/access?t=${accessToken}`

    await sendClientMagicLinkEmail(client.name, client.email, org.name, accessUrl)
  } catch {
    // Swallow errors — don't leak anything
  }

  return { success: true }
}
