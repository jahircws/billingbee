import { Resend } from "resend"
import { getCurrencyLocale } from "@/lib/utils"

const DEFAULT_FROM = process.env.RESEND_FROM ?? "BillingBee <hello@billingbee.co>"

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "re_placeholder")
}

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
}

interface SendResult {
  id?: string
  error?: string
}

export async function sendEmail({ to, subject, html, text, from, replyTo }: SendEmailOptions): Promise<SendResult> {
  try {
    const resend = getResend()
    const { data, error } = await resend.emails.send({
      from: from ?? DEFAULT_FROM,
      to,
      subject,
      html,
      text: text ?? "",
      ...(replyTo ? { reply_to: replyTo } : {}),
    })
    if (error) return { error: error.message }
    return { id: data?.id }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" }
  }
}

// ── Base layout ────────────────────────────────────────────────────────────

function layout(body: string, preheader = ""): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>BillingBee</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>` : ""}
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
      <!-- Header -->
      <tr>
        <td style="background:#059669;border-radius:12px 12px 0 0;padding:24px 32px;">
          <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">BillingBee</span>
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td style="background:#ffffff;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;">
          ${body}
        </td>
      </tr>
      <!-- Footer -->
      <tr>
        <td style="padding:24px 0 0;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            BillingBee · billingbee.co
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

function btn(text: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="background:#059669;border-radius:8px;">
      <a href="${url}" style="display:inline-block;color:#ffffff;font-size:15px;font-weight:600;padding:12px 28px;text-decoration:none;">${text}</a>
    </td>
  </tr>
</table>`
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;line-height:1.3;">${text}</h1>`
}

function p(text: string): string {
  return `<p style="margin:0 0 14px;font-size:15px;color:#374151;line-height:1.6;">${text}</p>`
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>`
}

function fmtAmount(amount: number, currency = "INR"): string {
  try {
    return new Intl.NumberFormat(getCurrencyLocale(currency), { style: "currency", currency, maximumFractionDigits: 2 }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

// ── welcomeEmail ───────────────────────────────────────────────────────────

export async function sendWelcomeEmail(userName: string, userEmail: string, orgName: string) {
  const body = `
    ${h1(`Your BillingBee account is ready`)}
    ${p(`Hi ${userName}, your account for <strong>${orgName}</strong> has been created. Here are a few things to get started:`)}
    ${divider()}
    <table cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding:10px 0;font-size:15px;color:#374151;">
          <span style="color:#059669;font-weight:700;">1 ·</span> Create your first invoice
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;font-size:15px;color:#374151;">
          <span style="color:#059669;font-weight:700;">2 ·</span> Add your logo and business details in Settings
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;font-size:15px;color:#374151;">
          <span style="color:#059669;font-weight:700;">3 ·</span> Invite your first client to the client portal
        </td>
      </tr>
    </table>
    ${btn("Go to dashboard", `${process.env.NEXT_PUBLIC_BASE_URL ?? "https://billingbee.co"}/dashboard`)}
    ${p(`Questions? Reply to this email and we'll help you out.`)}
  `
  return sendEmail({
    to: userEmail,
    subject: "Your BillingBee account is ready",
    html: layout(body, `Your BillingBee account is ready, ${userName}.`),
    replyTo: "hello@billingbee.co",
  })
}

// ── invoiceSentEmail ───────────────────────────────────────────────────────

interface InvoiceEmailData {
  invoiceNumber: string
  orgName: string
  issueDate: Date | string
  dueDate: Date | string | null
  total: number
  currency?: string
  items?: { description: string; quantity: number; unitPrice: number; total: number }[]
}

export async function sendInvoiceSentEmail(
  invoice: InvoiceEmailData,
  clientName: string,
  clientEmail: string,
  paymentUrl: string,
) {
  const currency = invoice.currency ?? "INR"
  const formatted = fmtAmount(invoice.total, currency)
  const issueStr = new Date(invoice.issueDate).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })
  const dueStr = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })
    : "—"

  const lineItemsHtml = invoice.items?.length
    ? `${divider()}
       <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
         <tr style="background:#f9fafb;">
           <td style="padding:8px 12px;color:#6b7280;font-weight:600;">Description</td>
           <td style="padding:8px 12px;color:#6b7280;font-weight:600;text-align:right;">Qty</td>
           <td style="padding:8px 12px;color:#6b7280;font-weight:600;text-align:right;">Amount</td>
         </tr>
         ${invoice.items.map((item) => `
           <tr style="border-top:1px solid #f3f4f6;">
             <td style="padding:10px 12px;color:#374151;">${item.description}</td>
             <td style="padding:10px 12px;color:#374151;text-align:right;">${item.quantity}</td>
             <td style="padding:10px 12px;color:#374151;text-align:right;">${fmtAmount(Number(item.total), currency)}</td>
           </tr>`).join("")}
         <tr style="border-top:2px solid #e5e7eb;background:#f9fafb;">
           <td colspan="2" style="padding:12px;font-weight:700;color:#111827;">Total</td>
           <td style="padding:12px;font-weight:700;color:#059669;text-align:right;font-size:16px;">${formatted}</td>
         </tr>
       </table>`
    : ""

  const body = `
    ${h1(`${invoice.orgName} sent you an invoice`)}
    ${p(`Hi ${clientName}, you have a new invoice from <strong>${invoice.orgName}</strong>.`)}
    <table cellpadding="0" cellspacing="0" width="100%" style="font-size:14px;margin:0 0 20px;">
      <tr>
        <td style="padding:6px 0;color:#6b7280;">Invoice</td>
        <td style="padding:6px 0;font-weight:600;color:#111827;text-align:right;">${invoice.invoiceNumber}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#6b7280;">Date</td>
        <td style="padding:6px 0;color:#374151;text-align:right;">${issueStr}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#6b7280;">Due date</td>
        <td style="padding:6px 0;color:#374151;text-align:right;">${dueStr}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#6b7280;font-weight:700;">Amount due</td>
        <td style="padding:6px 0;font-weight:800;color:#059669;text-align:right;font-size:18px;">${formatted}</td>
      </tr>
    </table>
    ${lineItemsHtml}
    ${btn("Pay Now →", paymentUrl)}
    ${p(`Questions? Reply to this email or contact ${invoice.orgName} directly.`)}
  `
  return sendEmail({
    to: clientEmail,
    subject: `${invoice.orgName} sent you an invoice for ${formatted}`,
    html: layout(body, `You have an invoice for ${formatted} due ${dueStr}.`),
  })
}

// ── paymentReceivedEmail (to staff) ───────────────────────────────────────

export async function sendPaymentReceivedEmail(
  invoiceNumber: string,
  clientName: string,
  amount: number,
  currency: string,
  staffEmail: string,
  orgName: string,
  invoiceId?: string,
) {
  const formatted = fmtAmount(amount, currency)
  const body = `
    ${h1(`Payment received 🎉`)}
    ${p(`<strong>${clientName}</strong> just paid <strong>${formatted}</strong> for invoice <strong>${invoiceNumber}</strong>.`)}
    ${divider()}
    <table cellpadding="0" cellspacing="0" width="100%" style="font-size:14px;">
      <tr>
        <td style="padding:6px 0;color:#6b7280;">Client</td>
        <td style="padding:6px 0;font-weight:600;color:#111827;text-align:right;">${clientName}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#6b7280;">Amount</td>
        <td style="padding:6px 0;font-weight:800;color:#059669;text-align:right;font-size:18px;">${formatted}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#6b7280;">Invoice</td>
        <td style="padding:6px 0;color:#374151;text-align:right;">${invoiceNumber}</td>
      </tr>
    </table>
    ${btn("View invoice →", invoiceId ? `${process.env.NEXT_PUBLIC_BASE_URL ?? "https://billingbee.co"}/invoices/${invoiceId}` : `${process.env.NEXT_PUBLIC_BASE_URL ?? "https://billingbee.co"}/invoices`)}
  `
  return sendEmail({
    to: staffEmail,
    subject: `Payment received — ${clientName} paid ${formatted}`,
    html: layout(body, `${clientName} paid ${formatted}.`),
    from: `${orgName} via BillingBee <noreply@billingbee.co>`,
  })
}

// ── paymentReceiptEmail (to client) ───────────────────────────────────────

export async function sendPaymentReceiptEmail(
  invoiceNumber: string,
  orgName: string,
  amount: number,
  currency: string,
  clientName: string,
  clientEmail: string,
  portalLink?: string,
) {
  const formatted = fmtAmount(amount, currency)
  const now = new Date().toLocaleDateString(undefined, { day: "2-digit", month: "long", year: "numeric" })
  const body = `
    ${h1(`Payment confirmed — thank you!`)}
    ${p(`Hi ${clientName}, we've received your payment of <strong>${formatted}</strong> for invoice <strong>${invoiceNumber}</strong>. Your account is up to date.`)}
    ${divider()}
    <table cellpadding="0" cellspacing="0" width="100%" style="font-size:14px;">
      <tr>
        <td style="padding:6px 0;color:#6b7280;">Invoice</td>
        <td style="padding:6px 0;font-weight:600;color:#111827;text-align:right;">${invoiceNumber}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#6b7280;">Amount paid</td>
        <td style="padding:6px 0;font-weight:800;color:#059669;text-align:right;font-size:18px;">${formatted}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#6b7280;">Date</td>
        <td style="padding:6px 0;color:#374151;text-align:right;">${now}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#6b7280;">Paid to</td>
        <td style="padding:6px 0;color:#374151;text-align:right;">${orgName}</td>
      </tr>
    </table>
    ${divider()}
    ${p(`This email is your receipt. Please keep it for your records.`)}
    ${portalLink ? btn("View your invoice →", portalLink) : ""}
  `
  return sendEmail({
    to: clientEmail,
    subject: `Payment confirmed — Invoice ${invoiceNumber} from ${orgName}`,
    html: layout(body, `Your payment of ${formatted} to ${orgName} has been confirmed.`),
    from: `${orgName} via BillingBee <noreply@billingbee.co>`,
  })
}

// ── portalInviteEmail ──────────────────────────────────────────────────────

export async function sendPortalInviteEmail(
  clientName: string,
  clientEmail: string,
  orgName: string,
  loginUrl: string,
) {
  const body = `
    ${h1(`${orgName} invited you to view your documents`)}
    ${p(`Hi ${clientName}, <strong>${orgName}</strong> has set up a secure portal where you can view invoices, quotes, and contracts — and pay online.`)}
    <ul style="margin:0 0 20px;padding-left:20px;font-size:15px;color:#374151;line-height:1.8;">
      <li>View all your invoices and quotes</li>
      <li>Accept or reject proposals</li>
      <li>Sign contracts online</li>
      <li>Pay invoices securely</li>
    </ul>
    ${btn("View your documents →", loginUrl)}
    ${divider()}
    ${p(`This link is personal to you — don't share it. It expires in 7 days.`)}
  `
  return sendEmail({
    to: clientEmail,
    subject: `${orgName} invited you to view your documents`,
    html: layout(body, `${orgName} has shared invoices and documents with you.`),
    from: `${orgName} via BillingBee <noreply@billingbee.co>`,
  })
}

// ── trialExpiryEmail ───────────────────────────────────────────────────────

export async function sendTrialExpiryEmail(
  orgName: string,
  ownerEmail: string,
  daysLeft: number,
  checkoutUrl: string,
) {
  const urgency = daysLeft <= 1 ? "tomorrow" : `in ${daysLeft} days`
  const body = `
    ${h1(`Your free Pro trial ends ${urgency}`)}
    ${p(`Hi there, your BillingBee Pro trial for <strong>${orgName}</strong> ends ${urgency}. After that, you'll be moved to the free plan (5 invoices/month, 3 clients).`)}
    ${divider()}
    <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">What you'll keep on Pro</p>
    <ul style="margin:0 0 20px;padding-left:20px;font-size:15px;color:#374151;line-height:1.8;">
      <li>Unlimited invoices and clients</li>
      <li>AI invoice generation and copilot</li>
      <li>Automated payment follow-ups</li>
      <li>White-label client portal</li>
      <li>Cashflow forecasting</li>
    </ul>
    ${btn("Keep Pro for $9.99/month →", checkoutUrl)}
    ${p(`No pressure — you can always upgrade later from Settings.`)}
  `
  return sendEmail({
    to: ownerEmail,
    subject: `Your free Pro trial ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
    html: layout(body, `Pro trial ending ${urgency}. Keep unlimited invoices for $9.99/month.`),
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// RELAUNCH CAMPAIGN EMAILS
// ═══════════════════════════════════════════════════════════════════════════════

// ── Segment A — 695 verified users (3 months Pro free) ────────────────────────

export async function sendRelaunchiSegmentA(
  firstName: string,
  email: string,
  loginUrl = "https://billingbee.co/login?utm_source=relaunch&utm_campaign=segment-a&utm_medium=email",
) {
  const name = firstName || "there"
  const preheader = "The old version wasn't good enough. Here's what's new."

  const body = `
    <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">A note from the founder</p>
    ${h1(`Hey ${name},`)}
    ${p(`I'm Amit, founder of BillingBee.`)}
    ${p(`I want to be honest with you — <strong>the old version wasn't good enough.</strong><br/>
    The AI promised on the pricing page didn't work.<br/>
    The UI was frustrating. I know.`)}
    ${p(`We spent the last 3 months rebuilding everything from scratch.`)}
    ${divider()}
    <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Here's what's new</p>
    <ul style="margin:0 0 20px;padding-left:20px;font-size:15px;color:#374151;line-height:1.9;">
      <li>Upload any WhatsApp chat or email → instant invoice</li>
      <li>AI chases late payments automatically — you never have to follow up again</li>
      <li>Create invoices by typing naturally: <em>"Invoice Acme ₹25,000 for design"</em></li>
      <li>Works perfectly on mobile</li>
      <li>Razorpay, Stripe, and PayPal in one place</li>
    </ul>
    ${divider()}
    ${p(`Your account is ready. No credit card needed.<br/>
    <strong>You get 3 months of Pro free</strong> — our apology for the wait.`)}
    ${btn("→ Log in and try it", loginUrl)}
    ${p(`Thank you for sticking with us.`)}
    <p style="margin:0;font-size:15px;color:#374151;">— Amit, BillingBee</p>
  `

  return sendEmail({
    to: email,
    from: "Amit from BillingBee <amit@billingbee.co>",
    subject: "We rebuilt BillingBee from scratch — 3 months Pro free",
    html: layout(body, preheader),
    text: `Hey ${name},

I'm Amit, founder of BillingBee.

I want to be honest with you — the old version wasn't good enough.
The AI promised on the pricing page didn't work.
The UI was frustrating. I know.

We spent the last 3 months rebuilding everything from scratch.

Here's what's new:
• Upload any WhatsApp chat or email → instant invoice
• AI chases late payments automatically (you never have to follow up again)
• Create invoices by typing naturally: "Invoice Acme ₹25,000 for design"
• Works perfectly on mobile
• Razorpay, Stripe, and PayPal in one place

Your account is ready. No credit card needed.
You get 3 months of Pro free — our apology for the wait.

→ Log in and try it: ${loginUrl}

Thank you for sticking with us.
— Amit, BillingBee

---
BillingBee · AI-powered invoicing
Unsubscribe: https://billingbee.co/unsubscribe`,
  })
}

// ── Segment B — 4,230 auto-deactivated users (60 days Pro free) ───────────────

export async function sendRelaunchSegmentB(
  firstName: string,
  email: string,
  reactivateUrl = "https://billingbee.co/login?utm_source=relaunch&utm_campaign=segment-b&utm_medium=email",
) {
  const name = firstName || "there"
  const preheader = "We've completely rebuilt the product. 60 days Pro free to try it."

  const body = `
    ${h1(`Your BillingBee account is back`)}
    ${p(`Hi ${name},`)}
    ${p(`Your BillingBee account was paused after 6 months of inactivity.`)}
    ${p(`We've completely rebuilt the product. New AI features, new UI, new payment options. Much better than before.`)}
    ${divider()}
    <ul style="margin:0 0 20px;padding-left:20px;font-size:15px;color:#374151;line-height:1.9;">
      <li>AI creates invoices from natural language in seconds</li>
      <li>Upload WhatsApp screenshots → instant invoice</li>
      <li>Auto payment reminders — stop chasing clients</li>
      <li>Razorpay UPI + Stripe in every invoice</li>
      <li>GST-compliant PDFs, tax exports for your CA</li>
    </ul>
    ${divider()}
    ${p(`<strong>You get 60 days of Pro free</strong> to try the new version.`)}
    ${btn("→ Reactivate your account", reactivateUrl)}
    ${p(`No credit card needed. Cancel anytime.`)}
  `

  return sendEmail({
    to: email,
    from: "BillingBee <hello@billingbee.co>",
    subject: "Your BillingBee account is back — we rebuilt everything",
    html: layout(body, preheader),
    text: `Hi ${name},

Your BillingBee account was paused after 6 months of inactivity.

We've completely rebuilt the product. New AI features, new UI,
new payment options. Much better than before.

You get 60 days of Pro free to try the new version.

→ Reactivate your account: ${reactivateUrl}

No credit card needed. Cancel anytime.

---
BillingBee · AI-powered invoicing
Unsubscribe: https://billingbee.co/unsubscribe`,
  })
}

// ── Segment C — 3,899 unverified / never-activated (cold re-engagement) ───────

export async function sendRelaunchSegmentC(
  email: string,
  generateUrl = "https://billingbee.co/generate?utm_source=relaunch&utm_campaign=segment-c&utm_medium=email",
) {
  const preheader = "Upload a screenshot → get an invoice. No account needed."

  const body = `
    ${h1(`Create your first invoice in 60 seconds`)}
    ${p(`BillingBee AI is live.`)}
    <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px;background:#f0fdf4;border-radius:10px;border:1px solid #d1fae5;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 10px;font-size:15px;color:#374151;">
            📱 <strong>Upload a WhatsApp screenshot</strong> → get an invoice
          </p>
          <p style="margin:0 0 10px;font-size:15px;color:#374151;">
            💬 Or type: <em>"Invoice [client] ₹[amount] for [work]"</em>
          </p>
          <p style="margin:0;font-size:15px;color:#374151;">
            📄 <strong>No signup needed</strong> to start. Download your first invoice free.
          </p>
        </td>
      </tr>
    </table>
    ${btn("→ Try it at billingbee.co/generate", generateUrl)}
    ${divider()}
    <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">Free forever · No credit card · GST-compliant PDFs</p>
  `

  return sendEmail({
    to: email,
    from: "BillingBee <hello@billingbee.co>",
    subject: "Create your first invoice in 60 seconds — no account needed",
    html: layout(body, preheader),
    text: `BillingBee AI is live.

Upload a WhatsApp screenshot → get an invoice.
Or just type: "Invoice [client] ₹[amount] for [work]"

No signup needed to start. Download your first invoice free.

→ Try it: ${generateUrl}

Free forever. No credit card. GST-compliant PDFs.

---
BillingBee · AI-powered invoicing
Unsubscribe: https://billingbee.co/unsubscribe`,
  })
}

// ── sendContractEmail ──────────────────────────────────────────────────────

export async function sendContractEmail(
  clientName: string,
  clientEmail: string,
  orgName: string,
  contractTitle: string,
  contractUrl: string,
) {
  const body = `
    ${h1(`${orgName} sent you a contract to sign`)}
    ${p(`Hi ${clientName}, <strong>${orgName}</strong> has prepared a contract for you to review and sign electronically.`)}
    ${divider()}
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Contract</p>
    <p style="margin:0 0 20px;font-size:16px;font-weight:600;color:#111827;">${contractTitle}</p>
    ${btn("Review & sign →", contractUrl)}
    ${divider()}
    ${p(`Your electronic signature is legally binding. Questions? Reply to this email.`)}
  `
  return sendEmail({
    to: clientEmail,
    subject: `${orgName} sent you a contract to sign — ${contractTitle}`,
    html: layout(body, `${orgName} has sent you a contract. Click to review and sign.`),
  })
}

// ── sendProposalEmail ──────────────────────────────────────────────────────

export async function sendQuoteEmail(
  clientName: string,
  clientEmail: string,
  orgName: string,
  quoteNumber: string,
  amount: string,
  quoteUrl: string,
) {
  const body = `
    ${h1(`${orgName} sent you a quote`)}
    ${p(`Hi ${clientName}, <strong>${orgName}</strong> has prepared quote <strong>${quoteNumber}</strong> for you.`)}
    ${divider()}
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Total</p>
    <p style="margin:0 0 20px;font-size:18px;font-weight:700;color:#111827;">${amount}</p>
    ${btn("View quote →", quoteUrl)}
    ${divider()}
    ${p(`Questions? Just reply to this email.`)}
  `
  return sendEmail({
    to: clientEmail,
    subject: `${orgName} sent you quote ${quoteNumber}`,
    html: layout(body, `${orgName} has sent you a quote. Click to review.`),
  })
}

export async function sendProposalEmail(
  clientName: string,
  clientEmail: string,
  orgName: string,
  proposalTitle: string,
  proposalUrl: string,
) {
  const body = `
    ${h1(`${orgName} sent you a proposal`)}
    ${p(`Hi ${clientName}, <strong>${orgName}</strong> has prepared a proposal for you. Please review it and let them know if you\'d like to proceed.`)}
    ${divider()}
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Proposal</p>
    <p style="margin:0 0 20px;font-size:16px;font-weight:600;color:#111827;">${proposalTitle}</p>
    ${btn("Review & respond →", proposalUrl)}
    ${divider()}
    ${p(`You can accept or decline directly from the link above. Questions? Reply to this email.`)}
  `
  return sendEmail({
    to: clientEmail,
    subject: `${orgName} sent you a proposal — ${proposalTitle}`,
    html: layout(body, `${orgName} has sent you a proposal. Click to review and respond.`),
  })
}

// ── sendClientMagicLinkEmail ───────────────────────────────────────────────

export async function sendClientMagicLinkEmail(
  clientName: string,
  clientEmail: string,
  orgName: string,
  accessUrl: string,
) {
  const body = `
    ${h1(`Sign in to ${orgName}'s client portal`)}
    ${p(`Hi ${clientName}, click the button below to sign in to your portal. This link expires in 7 days.`)}
    ${btn("Sign in to portal →", accessUrl)}
    ${divider()}
    ${p(`If you didn't request this link, you can safely ignore this email.`)}
  `
  return sendEmail({
    to: clientEmail,
    subject: `Your sign-in link for ${orgName}'s client portal`,
    html: layout(body, `Sign in to view your invoices and documents from ${orgName}.`),
  })
}
