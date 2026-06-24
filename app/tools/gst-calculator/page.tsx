import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/metadata"
import GSTCalculatorClient from "./client"

export const metadata: Metadata = {
  ...generatePageMetadata(
    "Free GST Calculator India — Add or Remove GST Instantly | BillingBee",
    "Calculate GST instantly for any amount. Add GST or reverse-calculate to remove GST. Supports 5%, 12%, 18%, 28% rates. Free, no signup required.",
    "/tools/gst-calculator",
    {
      keywords: [
        "GST calculator",
        "GST calculator India",
        "add GST calculator",
        "remove GST reverse calculator",
        "GST amount calculator",
        "CGST SGST calculator",
        "18% GST calculator",
      ],
    }
  ),
  alternates: {
    canonical: "https://www.billingbee.co/tools/gst-calculator",
  },
  other: {
    "application/ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "BillingBee Free GST Calculator",
      url: "https://www.billingbee.co/tools/gst-calculator",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
        availability: "https://schema.org/InStock",
      },
      description:
        "Free online GST calculator for India. Add GST to any amount or reverse-calculate to remove GST. Supports 5%, 12%, 18%, and 28% GST rates with CGST/SGST breakdown.",
    }),
  },
}

export default function GSTCalculatorPage() {
  return <GSTCalculatorClient />
}
