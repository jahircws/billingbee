import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.razorpay.com  https://lumberjack.razorpay.com https://checkout.razorpay.com https://www.paypal.com https://www.google.com https://www.gstatic.com https://apis.google.com https://www.googletagmanager.com https://googleads.g.doubleclick.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://stripe.com https://razorpay.com https://*.stripe.com https://*.razorpay.com https://*.google.com https://*.google.co.in https://*.googleapis.com https://*.gstatic.com https://googleads.g.doubleclick.net https://ad.doubleclick.net",
      "frame-src https://js.stripe.com https://api.razorpay.com https://checkout.razorpay.com https://www.paypal.com https://www.sandbox.paypal.com https://accounts.google.com https://www.gstatic.com https://recaptcha.google.com https://www.google.com",
      "frame-ancestors 'self'",
      "connect-src 'self' https://api.stripe.com https://cdn.razorpay.com https://lumberjack.razorpay.com https://api.razorpay.com https://www.paypal.com https://*.supabase.co wss://*.supabase.co https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://analytics.google.com https://stats.g.doubleclick.net https://ad.doubleclick.net https://www.google.com https://www.google.co.in",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      ...(process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_BASE_URL?.startsWith("https") ? ["upgrade-insecure-requests"] : []),
    ].join("; "),
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "interest-cohort=()",
      "payment=(self https://js.stripe.com https://checkout.razorpay.com)",
    ].join(", "),
  },
];

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/pay/:token*",
          destination: "/pay/:token*",
        },
      ],
      afterFiles: [],
      fallback: [],
    }
  },

  async redirects() {
    return [
      {
        source: "/:path+/",
        destination: "/:path+",
        permanent: true,
      },
      {
        source: "/register-now",
        destination: "/generate",
        permanent: true,
      },
      {
        source: "/login-now",
        destination: "/login",
        permanent: true,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "stripe.com",
      },
      {
        protocol: "https",
        hostname: "*.stripe.com",
      },
      {
        protocol: "https",
        hostname: "razorpay.com",
      },
      {
        protocol: "https",
        hostname: "*.razorpay.com",
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  widenClientFileUpload: false,
  disableLogger: true,
  automaticVercelMonitors: false,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
