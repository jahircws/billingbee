import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/metadata"
import GenerateClient from "./generate-client"

// Cache at CDN edge for 1 hour — no DB queries, pure client component
export const revalidate = 3600

export function generateMetadata(): Metadata {
  const meta = generatePageMetadata(
    "Free Invoice Generator — Create & Download in 60 Seconds | BillingBee",
    "Generate a professional GST invoice, quote, or proposal with AI. Download free as PDF. No signup needed. Trusted by 700+ Indian freelancers.",
    "/generate",
    {
      keywords: [
        "free invoice generator India",
        "GST invoice maker online",
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
          "Generate professional GST invoices, quotes, and proposals with AI. Free. No signup required.",
        offers: [
          {
            "@type": "Offer",
            name: "Free",
            price: "0",
            priceCurrency: "INR",
            description: "5 invoices/month — no signup required for first invoice",
          },
          {
            "@type": "Offer",
            name: "Pro",
            price: "999",
            priceCurrency: "INR",
            billingIncrement: "P1M",
            description: "Unlimited invoices, AI collections, Razorpay payment links",
          },
          {
            "@type": "Offer",
            name: "Business",
            price: "2499",
            priceCurrency: "INR",
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

export default function GeneratePage() {
  return <GenerateClient />
}
