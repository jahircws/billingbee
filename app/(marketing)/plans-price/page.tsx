import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/metadata"
import { getGeoDefaults } from "@/lib/geo"
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
      operatingSystem: "Web",
      url: "https://billingbee.co",
      offers: [
        {
          "@type": "Offer",
          name: "Free Plan",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          description: "5 invoices/month, PDF download, tax calculations",
          priceSpecification: {
            "@type": "PriceSpecification",
            price: "0",
            priceCurrency: "USD",
            billingDuration: "P1M",
          },
        },
        {
          "@type": "Offer",
          name: "Pro Plan",
          price: "9.99",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          description: "Unlimited invoices, AI collections, payment links, full reports",
          priceSpecification: {
            "@type": "PriceSpecification",
            price: "9.99",
            priceCurrency: "USD",
            billingDuration: "P1M",
          },
        },
      ],
    }),
  },
}

export default async function PlansPage() {
  const geo = await getGeoDefaults()
  const isIndia = geo.country === "IN"
  return <PlansClient isIndia={isIndia} />
}
