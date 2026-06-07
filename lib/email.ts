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
