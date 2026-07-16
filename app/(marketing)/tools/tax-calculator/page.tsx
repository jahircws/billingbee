import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/metadata"
import TaxCalculatorClient from "./client"

export const metadata: Metadata = {
  ...generatePageMetadata(
    "Freelancer Tax Calculator India 2026",
    "Calculate your exact tax due. Free tool for freelancers, GST calculation included.",
    "/tools/tax-calculator",
    {
      keywords: [
        "freelancer tax calculator India",
        "income tax calculator 2026",
        "GST calculator freelancer",
        "advance tax calculator India",
        "consultant tax calculator",
        "new tax regime calculator",
        "Section 44ADA calculator",
        "income tax slab 2026",
      ],
    }
  ),
  alternates: {
    canonical: "https://www.billingbee.co/tools/tax-calculator",
  },
  other: {
    "application/ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "BillingBee Freelancer Tax Calculator India 2026",
      url: "https://www.billingbee.co/tools/tax-calculator",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
        availability: "https://schema.org/InStock",
      },
      description:
        "Free online tax calculator for Indian freelancers and consultants. Estimates income tax under new regime slabs, 4% education cess, 18% GST (if registered), advance tax quarterly instalments, and effective tax rate.",
    }),
  },
}

export default function TaxCalculatorPage() {
  return <TaxCalculatorClient />
}
