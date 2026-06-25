import Anthropic from "@anthropic-ai/sdk"
import prisma from "@/lib/db"
import { sendEmail } from "@/lib/email"
import { getCurrencyLocale } from "@/lib/utils"
import { generatePaymentToken } from "@/lib/payment-token"
import { format, differenceInDays } from "date-fns"

const client = new Anthropic()

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://billingbee.co"

const TONE_LABEL: Record<string, string> = {
  FRIENDLY: "friendly",
  REMINDER: "friendly reminder",
  FIRM: "firm but professional",
  ESCALATE: "urgent but respectful",
}

interface EventWithRelations {
  id: string
  orgId: string
  invoiceId: string
  dayNumber: number
  tone: string
  invoice: {
    id: string
    invoiceNumber: string
    status: string
    dueDate: Date | null
    total: { toString(): string }
    amountDue: { toString(): string }
    currency: string
    client: {
      name: string
      email: string | null
    }
    org: {
      name: string
      email: string | null
    }
  }
}

export async function processEvent(event: EventWithRelations): Promise<"sent" | "skipped" | "error"> {
  const { invoice } = event

  // Skip if already paid
  if (invoice.status === "PAID" || invoice.status === "DRAFT") {
    await prisma.collectionEvent.update({
      where: { id: event.id },
      data: { status: "SKIPPED" },
    })
    return "skipped"
  }

  const clientEmail = invoice.client.email
  if (!clientEmail) {
    await prisma.collectionEvent.update({
      where: { id: event.id },
      data: { status: "SKIPPED", errorMsg: "No client email" },
    })
    return "skipped"
  }

  const daysOverdue = invoice.dueDate
    ? Math.max(0, differenceInDays(new Date(), invoice.dueDate))
    : 0

  const paymentToken = generatePaymentToken(invoice.id, event.orgId)
  const paymentUrl = `${BASE_URL}/pay/${paymentToken}`

  const amountFmt = `${Number(invoice.amountDue).toLocaleString(getCurrencyLocale(invoice.currency), { minimumFractionDigits: 2 })} ${invoice.currency}`
  const dueDateFmt = invoice.dueDate ? format(invoice.dueDate, "d MMMM yyyy") : "—"

  // AI-generated email
  let subject = ""
  let htmlBody = ""
  let textBody = ""

  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 600,
      system:
        "You write professional payment reminder emails for small businesses. Sound human and natural — not automated. Vary wording. Never be rude. Always leave the relationship door open.",
      messages: [
        {
          role: "user",
          content: `Write a ${TONE_LABEL[event.tone] ?? "professional"} payment reminder.
From: ${invoice.org.name}
To: ${invoice.client.name}
Invoice: ${invoice.invoiceNumber} for ${amountFmt}
Due: ${dueDateFmt}${daysOverdue > 0 ? ` (${daysOverdue} days ago)` : ""}
Payment link: ${paymentUrl}
Return JSON only: { "subject": string, "textBody": string, "htmlBody": string }`,
        },
      ],
    })

    const raw = msg.content[0].type === "text" ? msg.content[0].text : ""
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error("No JSON in response")
    const parsed = JSON.parse(match[0])
    subject = parsed.subject
    htmlBody = parsed.htmlBody
    textBody = parsed.textBody
  } catch (err) {
    // Fallback template if AI fails
    subject = `Payment reminder: ${invoice.invoiceNumber}`
    textBody = `Hi ${invoice.client.name},\n\nThis is a reminder that invoice ${invoice.invoiceNumber} for ${amountFmt} is ${daysOverdue > 0 ? `${daysOverdue} days overdue` : "due"}.\n\nPay here: ${paymentUrl}\n\nThanks,\n${invoice.org.name}`
    htmlBody = `<p>Hi ${invoice.client.name},</p><p>This is a reminder that invoice <strong>${invoice.invoiceNumber}</strong> for <strong>${amountFmt}</strong> is ${daysOverdue > 0 ? `<strong>${daysOverdue} days overdue</strong>` : "due"}.</p><p><a href="${paymentUrl}" style="background:#059669;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;">Pay Now</a></p><p>Thanks,<br/>${invoice.org.name}</p>`
    void err // log would go here in production
  }

  // Send email
  const { error } = await sendEmail({ to: clientEmail, subject, html: htmlBody, text: textBody })

  if (error) {
    await prisma.collectionEvent.update({
      where: { id: event.id },
      data: { status: "FAILED", errorMsg: error, subject, htmlBody, textBody, attempts: { increment: 1 } },
    })
    return "error"
  }

  await prisma.collectionEvent.update({
    where: { id: event.id },
    data: { status: "SENT", sentAt: new Date(), subject, htmlBody, textBody },
  })

  return "sent"
}
