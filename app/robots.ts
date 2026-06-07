import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/blog",
          "/plans-price",
          "/faq",
          "/contact",
          "/free-invoice-generator",
          "/free-invoice-resources",
          "/privacy-policy",
          "/terms-service",
        ],
        disallow: [
          "/dashboard",
          "/portal",
          "/admin",
          "/pay",
          "/api/",
          "/_next/",
          "/auth/",
          "/onboarding/",
          "/settings/",
          "/invoices/",
          "/clients/",
        ],
      },
      { userAgent: "GPTBot", disallow: ["/"] },
      { userAgent: "ChatGPT-User", disallow: ["/"] },
      { userAgent: "Google-Extended", disallow: ["/"] },
      { userAgent: "CCBot", disallow: ["/"] },
      { userAgent: "anthropic-ai", disallow: ["/"] },
      { userAgent: "Claude-Web", disallow: ["/"] },
      { userAgent: "Bytespider", disallow: ["/"] },
      { userAgent: "PetalBot", disallow: ["/"] },
    ],
    sitemap: "https://billingbee.co/sitemap.xml",
  };
}
