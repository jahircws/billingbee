import type { Metadata } from "next"

export const defaultMetadata: Metadata = {
  metadataBase: new URL("https://billingbee.co"),
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
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://billingbee.co",
    siteName: "BillingBee",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "BillingBee" }],
  },
  robots: { index: true, follow: true },
}

export const privateMetadata: Metadata = {
  robots: { index: false, follow: false },
}

export function generatePageMetadata(
  title: string,
  description: string,
  path: string
): Metadata {
  return {
    ...defaultMetadata,
    title,
    description,
    alternates: { canonical: `https://billingbee.co${path}` },
    openGraph: {
      ...(defaultMetadata.openGraph as object),
      title,
      description,
      url: `https://billingbee.co${path}`,
    },
  }
}
