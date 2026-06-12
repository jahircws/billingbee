import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/metadata"
import PlansClient from "./PlansClient"

export const revalidate = 3600

export const metadata: Metadata = {
  ...generatePageMetadata(
    "Pricing — Free, Pro & Business Plans | BillingBee",
    "BillingBee pricing: Free (5 invoices/mo), Pro $9.99/mo (unlimited + AI collections), Business $24.99/mo (teams + white-label). Cancel anytime.",
    "/plans-price",
    {
      keywords: [
        "billing software pricing",
        "invoice app cost",
        "invoicing plan",
        "freelancer billing price",
      ],
    }
  ),
  other: {
    "application/ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "BillingBee",
      applicationCategory: "BusinessApplication",
      url: "https://billingbee.co",
      offers: [
        {
          "@type": "Offer",
          name: "Free",
          price: "0",
          priceCurrency: "USD",
          description: "5 invoices/month, PDF download, tax calculations",
        },
        {
          "@type": "Offer",
          name: "Pro",
          price: "9.99",
          priceCurrency: "USD",
          billingIncrement: "P1M",
          description: "Unlimited invoices, AI collections, payment links, full reports",
        },
        {
          "@type": "Offer",
          name: "Business",
          price: "24.99",
          priceCurrency: "USD",
          billingIncrement: "P1M",
          description: "Team seats, white-label portal, API access, priority support",
        },
      ],
    }),
  },
}

export default function PlansPage() {
  return <PlansClient />
}
