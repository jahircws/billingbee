import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/metadata"
import PlansClient from "./PlansClient"

export const revalidate = 3600

export const metadata: Metadata = {
  ...generatePageMetadata(
    "Pricing — Free & Pro Plans | BillingBee",
    "BillingBee pricing: Free forever (5 invoices/mo) or Pro $9.99/mo — unlimited invoices, AI collections, payment links via Stripe, Razorpay & PayPal. Cancel anytime.",
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
      ],
    }),
  },
}

export default function PlansPage() {
  return <PlansClient />
}
