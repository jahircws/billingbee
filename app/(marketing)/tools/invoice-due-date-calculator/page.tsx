import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/metadata"
import InvoiceDueDateCalculatorClient from "./client"

export const metadata: Metadata = {
  ...generatePageMetadata(
    "Invoice Due Date Calculator — Net 30, Net 60 & Custom Terms | BillingBee",
    "Calculate exact invoice due dates from issue date. Supports Net-15, Net-30, Net-45, Net-60, Net-90 and custom payment terms. Free, no signup.",
    "/tools/invoice-due-date-calculator",
    {
      keywords: [
        "invoice due date calculator",
        "net 30 due date calculator",
        "net 60 payment terms calculator",
        "invoice payment terms calculator",
        "net 15 net 45 net 90 calculator",
        "when is invoice due",
      ],
    }
  ),
  alternates: {
    canonical: "https://www.billingbee.co/tools/invoice-due-date-calculator",
  },
  other: {
    "application/ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "BillingBee Invoice Due Date Calculator",
      url: "https://www.billingbee.co/tools/invoice-due-date-calculator",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
        availability: "https://schema.org/InStock",
      },
      description:
        "Free online invoice due date calculator. Supports Net-15, Net-30, Net-45, Net-60, Net-90, and custom payment terms. Shows days remaining or overdue with Google Calendar integration.",
    }),
  },
}

export default function InvoiceDueDateCalculatorPage() {
  return <InvoiceDueDateCalculatorClient />
}
