import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/metadata"
import LatePaymentCalculatorClient from "./client"

export const metadata: Metadata = {
  ...generatePageMetadata(
    "Late Payment Interest Calculator — Overdue Invoice Interest | BillingBee",
    "Calculate interest on overdue invoices instantly. Enter invoice amount, due date, and interest rate to know exactly how much to charge late-paying clients.",
    "/tools/late-payment-calculator",
    {
      keywords: [
        "late payment interest calculator",
        "overdue invoice interest",
        "invoice late fee calculator",
        "late payment charge calculator",
        "overdue payment interest India",
        "late payment penalty calculator",
      ],
    }
  ),
  alternates: {
    canonical: "https://www.billingbee.co/tools/late-payment-calculator",
  },
  other: {
    "application/ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "BillingBee Late Payment Interest Calculator",
      url: "https://www.billingbee.co/tools/late-payment-calculator",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
        availability: "https://schema.org/InStock",
      },
      description:
        "Free online calculator for late payment interest on overdue invoices. Enter invoice amount, due date, and annual interest rate to calculate how much to charge late-paying clients.",
    }),
  },
}

export default function LatePaymentCalculatorPage() {
  return <LatePaymentCalculatorClient />
}
