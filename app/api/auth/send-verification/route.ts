import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { sendEmail } from "@/lib/email"
import { randomBytes } from "crypto"

export async function POST() {
  const session = await auth()
  const userId = (session?.user as { userId?: string })?.userId
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, emailVerified: true } })
  if (!user?.email) return NextResponse.json({ error: "No email on account" }, { status: 400 })
  if (user.emailVerified) return NextResponse.json({ error: "Already verified" }, { status: 400 })

  const token = randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24) // 24 hours

  await prisma.verificationToken.upsert({
    where: { identifier_token: { identifier: user.email, token } },
    update: { expires },
    create: { identifier: user.email, token, expires },
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const link = `${baseUrl}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`

  await sendEmail({
    to: user.email,
    subject: "Verify your BillingBee email",
    html: `
      <p>Hi,</p>
      <p>Click the link below to verify your email address. This link expires in 24 hours.</p>
      <p><a href="${link}" style="background:#059669;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Verify Email</a></p>
      <p>Or copy this URL into your browser:<br/>${link}</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
    text: `Verify your BillingBee email\n\nClick this link to verify: ${link}\n\nExpires in 24 hours.`,
  })

  return NextResponse.json({ ok: true })
}
