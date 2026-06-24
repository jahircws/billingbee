import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/metadata"
import StartupNameGeneratorClient from "./client"

export const metadata: Metadata = {
  ...generatePageMetadata(
    "Free Startup Name Generator — 10 AI Business Name Ideas Instantly | BillingBee",
    "Generate creative startup and business name ideas instantly using AI. Get 10 unique name suggestions with domain availability links. Free, no signup required.",
    "/tools/startup-name-generator",
    {
      keywords: [
        "startup name generator",
        "business name generator",
        "AI business name ideas",
        "company name generator",
        "startup naming tool",
        "free business name ideas",
      ],
    }
  ),
  alternates: {
    canonical: "https://www.billingbee.co/tools/startup-name-generator",
  },
}

export default function StartupNameGeneratorPage() {
  return <StartupNameGeneratorClient />
}
