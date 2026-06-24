import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/metadata"
import FreelancerRateClient from "./client"

export const metadata: Metadata = {
  ...generatePageMetadata(
    "Freelancer Hourly Rate Calculator — Find Your Minimum Rate | BillingBee",
    "Calculate your minimum freelance hourly rate based on your income goal, working hours, overhead costs, and vacation days. Free calculator, no signup.",
    "/tools/freelancer-rate-calculator",
    {
      keywords: [
        "freelancer hourly rate calculator",
        "freelance rate calculator",
        "minimum hourly rate freelancer",
        "how to calculate freelance rate",
        "freelancer pricing calculator",
        "self employed rate calculator",
      ],
    }
  ),
  alternates: {
    canonical: "https://www.billingbee.co/tools/freelancer-rate-calculator",
  },
  other: {
    "application/ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "BillingBee Freelancer Rate Calculator",
      url: "https://www.billingbee.co/tools/freelancer-rate-calculator",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
      description:
        "Free freelancer hourly rate calculator. Enter your income goal, working hours, overhead, and vacation time to find your minimum billable rate.",
    }),
  },
}

export default function FreelancerRatePage() {
  return <FreelancerRateClient />
}
