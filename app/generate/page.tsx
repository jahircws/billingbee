import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/metadata"
import GenerateClient from "./generate-client"
import { auth } from "@/auth"

export function generateMetadata(): Metadata {
  const meta = generatePageMetadata(
    "Free Invoice Generator — Create & Download in 60 Seconds | BillingBee",
    "Generate a professional invoice, quote, or proposal with AI in any currency. Download free as PDF. No signup needed. Trusted by 700+ freelancers worldwide.",
    "/generate",
    {
      keywords: [
        "free invoice generator",
        "invoice maker online",
        "AI invoice generator",
        "free invoice PDF download",
        "invoice without signup",
        "online billing tool free",
      ],
    }
  )
  return {
    ...meta,
    other: {
      "application/ld+json": JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "BillingBee Invoice Generator",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: "https://billingbee.co/generate",
        description:
          "Generate professional invoices, quotes, and proposals with AI in any currency. Free. No signup required.",
        offers: [
          {
            "@type": "Offer",
            name: "Free",
            price: "0",
            priceCurrency: "USD",
            description: "5 invoices/month — no signup required for first invoice",
          },
          {
            "@type": "Offer",
            name: "Pro",
            price: "9.99",
            priceCurrency: "USD",
            billingIncrement: "P1M",
            description: "Unlimited invoices, AI collections, Stripe payment links",
          },
          {
            "@type": "Offer",
            name: "Business",
            price: "24.99",
            priceCurrency: "USD",
            billingIncrement: "P1M",
            description: "Team seats, white-label portal, API access",
          },
        ],
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.8",
          ratingCount: "247",
          bestRating: "5",
        },
      }),
    },
  }
}

export default async function GeneratePage() {
  const session = await auth()
  return <GenerateClient loggedIn={!!session?.user} />
}
