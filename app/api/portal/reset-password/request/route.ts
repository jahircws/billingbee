import { NextRequest, NextResponse } from "next/server"
import { SignJWT } from "jose"
import prisma from "@/lib/db"
import { sendEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  const { email, orgSlug } = await req.json()
  if (!email || !orgSlug) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const org = await prisma.organization.findUnique({ where: { slug: orgSlug }, select: { id: true, name: true } })
  if (!org) return NextResponse.json({ ok: true }) // don't reveal org existence

  const client = await prisma.client.findFirst({
    where: { orgId: org.id, email: email.toLowerCase() },
    select: { id: true, name: true },
  })

  // Always return ok — don't reveal whether email exists
  if (!client) return NextResponse.json({ ok: true })

  const portalUser = await prisma.clientPortalUser.findFirst({
    where: { clientId: client.id, email: email.toLowerCase() },
  })
  if (!portalUser) return NextResponse.json({ ok: true })

  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET ?? "fallback-secret")
  const token = await new SignJWT({ clientId: client.id, email: email.toLowerCase(), orgSlug })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(secret)

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://billingbee.co"
  const resetUrl = `${base}/portal/${orgSlug}/reset-password?token=${token}`

  await sendEmail({
    to: email,
    subject: `Reset your ${org.name} portal password`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#111">
        <h2 style="font-size:20px;margin:0 0 8px">Reset your password</h2>
        <p style="color:#6b7280;font-size:14px;margin:0 0 24px">
          Hi ${client.name}, click the button below to reset your password for the ${org.name} client portal. This link expires in 1 hour.
        </p>
        <a href="${resetUrl}" style="display:inline-block;background:#059669;color:#fff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none">
          Reset password →
        </a>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  })

  return NextResponse.json({ ok: true })
}
