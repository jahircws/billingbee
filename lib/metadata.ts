import type { Metadata } from "next"

const BASE_URL = "https://billingbee.co"

// Default OG image — served by dynamic route /og or static fallback
const DEFAULT_OG = `/og?title=${encodeURIComponent("BillingBee — AI Invoicing for India")}`

export const defaultMetadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "BillingBee — AI-Powered Invoicing for Indian Freelancers",
    template: "%s | BillingBee",
  },
  description:
    "Create GST invoices in seconds with natural language. Accept payments via Razorpay, Stripe & PayPal. Built for Indian freelancers and small businesses.",
  keywords: [
    "invoice software India",
    "GST invoice generator",
    "AI invoicing",
    "freelancer billing",
    "free invoice generator",
    "online invoice maker",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: BASE_URL,
    siteName: "BillingBee",
    images: [{ url: DEFAULT_OG, width: 1200, height: 630, alt: "BillingBee — AI Invoicing" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@billingbeeapp",
    images: [DEFAULT_OG],
  },
  robots: { index: true, follow: true },
}

export const privateMetadata: Metadata = {
  robots: { index: false, follow: false },
  twitter: { card: "summary" },
}

export function generatePageMetadata(
  title: string,
  description: string,
  path: string,
  opts?: { keywords?: string[]; imageUrl?: string }
): Metadata {
  const image = opts?.imageUrl ?? `/og?title=${encodeURIComponent(title)}&sub=${encodeURIComponent(description.slice(0, 80))}`
  return {
    ...defaultMetadata,
    title,
    description,
    ...(opts?.keywords ? { keywords: opts.keywords } : {}),
    alternates: { canonical: `${BASE_URL}${path}` },
    openGraph: {
      ...(defaultMetadata.openGraph as object),
      title,
      description,
      url: `${BASE_URL}${path}`,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@billingbeeapp",
      title,
      description,
      images: [image],
    },
  }
}
