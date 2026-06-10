import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  if (!token || !email) {
    return NextResponse.redirect(`${baseUrl}/dashboard?verified=invalid`)
  }

  const record = await prisma.verificationToken.findFirst({
    where: { identifier: email, token },
  })

  if (!record) {
    return NextResponse.redirect(`${baseUrl}/dashboard?verified=invalid`)
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { identifier_token: { identifier: email, token } } })
    return NextResponse.redirect(`${baseUrl}/dashboard?verified=expired`)
  }

  try {
    await prisma.$transaction([
      prisma.user.update({ where: { email }, data: { emailVerified: new Date() } }),
      prisma.verificationToken.delete({ where: { identifier_token: { identifier: email, token } } }),
    ])
  } catch {
    return NextResponse.redirect(`${baseUrl}/dashboard?verified=invalid`)
  }

  return NextResponse.redirect(`${baseUrl}/dashboard?verified=success`)
}
