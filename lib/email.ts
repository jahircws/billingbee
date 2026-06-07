import { Resend } from "resend"

const DEFAULT_FROM = "BillingBee <noreply@billingbee.co>"

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "re_placeholder")
}

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
}

interface SendResult {
  id?: string
  error?: string
}

export async function sendEmail({ to, subject, html, text, from }: SendEmailOptions): Promise<SendResult> {
  try {
    const resend = getResend()
    const { data, error } = await resend.emails.send({
      from: from ?? DEFAULT_FROM,
      to,
      subject,
      html,
      text: text ?? "",
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
            BillingBee · AI-powered invoicing<br/>
            <a href="https://billingbee.co/unsubscribe" style="color:#9ca3af;">Unsubscribe</a>
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
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

// ── welcomeEmail ───────────────────────────────────────────────────────────

export async function sendWelcomeEmail(userName: string, userEmail: string, orgName: string) {
  const body = `
    ${h1(`Welcome to BillingBee, ${userName}! 👋`)}
    ${p(`You've created <strong>${orgName}</strong>. BillingBee is your AI-powered finance assistant — it writes invoices, chases payments, and helps you get paid faster.`)}
    ${divider()}
    <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">3 things to do first</p>
    <table cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding:10px 0;font-size:15px;color:#374151;">
          <span style="color:#059669;font-weight:700;">1 ·</span> Create your first invoice in <strong>60 seconds</strong>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;font-size:15px;color:#374151;">
          <span style="color:#059669;font-weight:700;">2 ·</span> Add your logo and business details in <strong>Settings</strong>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;font-size:15px;color:#374151;">
          <span style="color:#059669;font-weight:700;">3 ·</span> Invite your first client to the <strong>client portal</strong>
        </td>
      </tr>
    </table>
    ${btn("Create your first invoice →", "https://billingbee.co/generate")}
    ${p(`Need help? Just reply to this email — we read every message.`)}
  `
  return sendEmail({
    to: userEmail,
    subject: "Welcome to BillingBee — your AI finance assistant",
    html: layout(body, `Welcome ${userName}! Create your first invoice in 60 seconds.`),
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
  const issueStr = new Date(invoice.issueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
  const dueStr = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
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
    ${btn("View invoice →", "https://billingbee.co/invoices")}
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
) {
  const formatted = fmtAmount(amount, currency)
  const now = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
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
  `
  return sendEmail({
    to: clientEmail,
    subject: `Payment confirmed — thank you`,
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
