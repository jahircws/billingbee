import { NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"
import { isValidEmail, sanitizeInput } from "@/lib/sanitize"
import { checkRateLimit } from "@/lib/rate-limit"

const SUPPORT_INBOX = process.env.CONTACT_INBOX ?? "hello@billingbee.co"

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, "contact")
  if (limited) return limited

  let body: { name?: string; email?: string; subject?: string; message?: string; website?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  // Honeypot — bots fill hidden fields; real users never see this field
  if (body.website) {
    return NextResponse.json({ success: true })
  }

  const name = sanitizeInput(body.name)
  const email = sanitizeInput(body.email)
  const subject = sanitizeInput(body.subject)
  const message = sanitizeInput(body.message)

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Name, email and message are required" }, { status: 400 })
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 })
  }

  const safeSubject = subject || "New contact form message"
  const html = `
    <h2 style="margin:0 0 12px;">New contact form submission</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Subject:</strong> ${safeSubject}</p>
    <p><strong>Message:</strong></p>
    <p style="white-space:pre-wrap;">${message}</p>
  `

  const result = await sendEmail({
    to: SUPPORT_INBOX,
    subject: `[Contact] ${safeSubject}`,
    html,
    text: `From: ${name} <${email}>\nSubject: ${safeSubject}\n\n${message}`,
    replyTo: email,
  })

  if (result.error) {
    return NextResponse.json({ error: "Could not send your message. Please email us directly." }, { status: 502 })
  }

  return NextResponse.json({ success: true })
}
