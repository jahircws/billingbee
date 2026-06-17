import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const GA_ID = "G-YEWV6WJ77T"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://billingbee.co"),
  title: {
    default: "BillingBee — AI-Powered Invoicing for Freelancers Worldwide",
    template: "%s | BillingBee",
  },
  description:
    "Create invoices in any currency in seconds with AI. Accept payments via Stripe, Razorpay & PayPal. Built for freelancers everywhere — with full GST and UPI support for India.",
  applicationName: "BillingBee",
  keywords: [
    "AI invoicing",
    "invoice software",
    "freelancer billing",
    "multi-currency invoicing",
    "online invoice maker",
    "GST invoice generator",
  ],
  authors: [{ name: "BillingBee" }],
  creator: "BillingBee",
  publisher: "BillingBee",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://billingbee.co",
    siteName: "BillingBee",
    title: "BillingBee — AI-Powered Invoicing for Freelancers Worldwide",
    description:
      "Create invoices in any currency in seconds with AI. Accept payments via Stripe, Razorpay & PayPal. Built for freelancers everywhere — with full GST and UPI support for India.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "BillingBee — AI-Powered Invoicing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BillingBee — AI-Powered Invoicing for Freelancers Worldwide",
    description:
      "Create invoices in any currency in seconds with AI. Accept payments via Stripe, Razorpay & PayPal. Built for freelancers everywhere — with full GST and UPI support for India.",
    images: ["/logo.png"],
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        {children}
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { page_path: window.location.pathname });
        `}</Script>
      </body>
    </html>
  );
}
