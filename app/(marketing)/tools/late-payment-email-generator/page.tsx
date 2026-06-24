import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/metadata"
import LatePaymentEmailGeneratorClient from "./client"

export const metadata: Metadata = {
  ...generatePageMetadata(
    "Free Late Payment Email Generator — AI Payment Reminder Emails | BillingBee",
    "Generate professional payment reminder emails instantly using AI. Choose from friendly, firm, or final notice tone. Free, no signup required.",
    "/tools/late-payment-email-generator",
    {
      keywords: [
        "late payment email generator",
        "payment reminder email",
        "overdue invoice email",
        "AI email generator",
        "payment reminder template",
        "invoice follow up email",
      ],
    }
  ),
  alternates: {
    canonical: "https://www.billingbee.co/tools/late-payment-email-generator",
  },
}

export default function LatePaymentEmailGeneratorPage() {
  return <LatePaymentEmailGeneratorClient />
}
