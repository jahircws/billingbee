import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://billingbee.co"),
  title: {
    default: "BillingBee — AI-Powered Invoicing for Indian Freelancers",
    template: "%s | BillingBee",
  },
  description:
    "Create GST invoices in seconds with natural language. Accept payments via Razorpay, Stripe & PayPal. Built for Indian freelancers and small businesses.",
  applicationName: "BillingBee",
  keywords: [
    "invoice software India",
    "GST invoice generator",
    "AI invoicing",
    "freelancer billing",
    "Razorpay invoicing",
    "online invoice maker",
  ],
  authors: [{ name: "BillingBee" }],
  creator: "BillingBee",
  publisher: "BillingBee",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://billingbee.co",
    siteName: "BillingBee",
    title: "BillingBee — AI-Powered Invoicing for Indian Freelancers",
    description:
      "Create GST invoices in seconds with natural language. Accept payments via Razorpay, Stripe & PayPal.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "BillingBee — AI-Powered Invoicing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BillingBee — AI-Powered Invoicing for Indian Freelancers",
    description:
      "Create GST invoices in seconds with natural language. Accept payments via Razorpay, Stripe & PayPal.",
    images: ["/og-image.png"],
    creator: "@billingbee",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
