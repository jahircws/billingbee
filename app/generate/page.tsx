import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/metadata"
import GenerateClient from "./generate-client"

// Cache at CDN edge for 1 hour (no DB queries, no session, pure client component)
export const revalidate = 3600

export function generateMetadata(): Metadata {
  const meta = generatePageMetadata(
    "Free Invoice Generator — Create & Download in 60 Seconds | BillingBee",
    "Generate a professional invoice, quote, or proposal with AI. Download free as PDF. No signup needed.",
    "/generate"
  )
  return {
    ...meta,
    other: {
      "application/ld+json": JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "BillingBee Invoice Generator",
        applicationCategory: "BusinessApplication",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        description: "Generate professional invoices, quotes, and proposals with AI. Free. No signup.",
        url: "https://billingbee.co/generate",
      }),
    },
  }
}

export default function GeneratePage() {
  return <GenerateClient />
}
