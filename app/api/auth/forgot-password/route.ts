import { NextRequest, NextResponse } from "next/server"
import { SignJWT } from "jose"
import prisma from "@/lib/db"
import { sendEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ ok: true }) // always return ok

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })

  if (user) {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET ?? "fallback-secret")
    const token = await new SignJWT({ userId: user.id, email: user.email })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(secret)

    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://beta.billingbee.co"
    const resetUrl = `${base}/reset-password?token=${token}`

    await sendEmail({
      to: user.email,
      subject: "Reset your BillingBee password",
      html: `
        <p>Hi ${user.name ?? "there"},</p>
        <p>You requested a password reset. Click the link below to set a new password. This link expires in 1 hour.</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
      text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour.`,
    })
  }

  return NextResponse.json({ ok: true })
}
