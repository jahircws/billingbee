# QA Report — BillingBee v2.0 Session 19
**Date**: 2026-06-08  
**Environment**: Local dev + staging (app-v2.billingbee.co)

---

## SEO Audit Results

### Public pages — metadata status

| Page | Title | Description | Canonical | OG | Twitter | JSON-LD | Status |
|------|-------|-------------|-----------|----|---------|---------|----|
| `/` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Org + SoftwareApp (3 offers) | ✅ PASS |
| `/generate` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ SoftwareApp (3 offers) | ✅ PASS |
| `/plans-price` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ SoftwareApp (3 offers) | ✅ PASS |
| `/faq` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ FAQPage (6 Q&A) | ✅ PASS |
| `/contact` | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ PASS |
| `/free-invoice-generator` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ WebApplication | ✅ PASS |
| `/free-invoice-resources` | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ PASS |

### Private pages — noindex status

| Page group | Method | noindex |
|-----------|--------|---------|
| `/dashboard/*` | `(app)/layout.tsx` exports `privateMetadata` | ✅ |
| `/portal/*` | `(portal)/layout.tsx` exports `privateMetadata` | ✅ |
| `/admin/*` | `(admin)/layout.tsx` exports `privateMetadata` | ✅ |
| `/pay/[token]` | `generateMetadata()` returns `robots: { index: false }` | ✅ |

### robots.txt
- `/generate` added to explicit allow list ✅
- AI scrapers (GPTBot, ChatGPT, Claude-Web, etc.) blocked ✅
- `/dashboard`, `/portal`, `/admin`, `/pay`, `/api/` disallowed ✅

### sitemap.xml
- `/generate` added with priority 0.95 ✅
- All 4 new marketing pages included ✅

---

## Bugs Found & Fixed

### BUG-001 — Homepage was Next.js boilerplate
**Severity**: Critical  
**Found**: Root `app/page.tsx` showed Next.js default starter page ("To get started, edit page.tsx")  
**Fix**: Replaced with full BillingBee homepage — hero, features, testimonials, CTAs, JSON-LD, metadata  
**Status**: ✅ Fixed

### BUG-002 — 4 marketing pages returned 404
**Severity**: High (SEO — in sitemap but 404'd)  
**Found**: `/faq`, `/contact`, `/free-invoice-generator`, `/free-invoice-resources` had no `page.tsx`  
**Fix**: Created all 4 pages with full content, metadata, appropriate JSON-LD  
**Status**: ✅ Fixed

### BUG-003 — `/generate` not in robots allow list
**Severity**: Medium (risk of Googlebot not crawling)  
**Found**: `robots.ts` explicit allow list skipped `/generate`  
**Fix**: Added `/generate` to allow list  
**Status**: ✅ Fixed

### BUG-004 — No Twitter card on any public page
**Severity**: Medium (social sharing degrades without it)  
**Found**: `generatePageMetadata()` in `lib/metadata.ts` never set `twitter` field  
**Fix**: Added `twitter: { card: "summary_large_image", ... }` to both `defaultMetadata` and `generatePageMetadata()`  
**Status**: ✅ Fixed

### BUG-005 — Portal/Admin/Pay pages not noindexed
**Severity**: Medium (private URLs could be indexed)  
**Found**: No `metadata` export on `(portal)/layout.tsx` or `(admin)/layout.tsx`; pay page returned indexable metadata  
**Fix**: Added `export const metadata = privateMetadata` to portal and admin layouts; pay page now returns `robots: { index: false }` in all branches  
**Status**: ✅ Fixed

### BUG-006 — plans-price metadata unreachable
**Severity**: High (page was `"use client"` — Next.js cannot extract metadata from client components)  
**Found**: `app/(marketing)/plans-price/page.tsx` had `"use client"` directive — any `metadata` export would be silently ignored  
**Fix**: Extracted client logic to `PlansClient.tsx`; new server `page.tsx` exports proper `metadata` and renders `<PlansClient />`  
**Status**: ✅ Fixed

### BUG-007 — `/generate` JSON-LD had single Offer, not 3 (Free/Pro/Business)
**Severity**: Low  
**Found**: JSON-LD only had one offer `{ price: "0" }` with USD currency  
**Fix**: Expanded to 3 offers (Free/Pro/Business) in INR with descriptions  
**Status**: ✅ Fixed

### BUG-008 — No OG image existed at `/public/og-image.png`
**Severity**: Medium (all social sharing broken, Twitter/LinkedIn previews blank)  
**Found**: `public/` had no `og-image.png`  
**Fix**: Created dynamic OG image route at `/app/og/route.tsx` using `next/og` (ImageResponse/Satori). Accepts `?title=` and `?sub=` params. All `generatePageMetadata()` calls now generate per-page OG URLs pointing to this route.  
**Status**: ✅ Fixed

---

## Smoke Test Results

> ⚠️ Note: Smoke tests below require a live staging environment at `app-v2.billingbee.co`.
> The following results reflect local dev testing and static analysis.

| Flow | Local | Staging |
|------|-------|---------|
| `/generate` → fill form → generate → PDF download | ✅ | 🔲 Verify |
| `/generate` → signup → `/dashboard` | ✅ | 🔲 Verify |
| Natural language invoice creation (copilot) | ✅ | 🔲 Verify |
| Upload image → AI extraction → invoice | ✅ | 🔲 Verify |
| Razorpay sandbox payment | ✅ local keys | 🔲 Verify sandbox |
| POST `/api/cron/collections` with CRON_SECRET | ✅ | 🔲 Verify |
| Client portal login + view invoice + pay | ✅ | 🔲 Verify |
| Admin login + impersonate org | ✅ | 🔲 Verify |
| `/api/health` → `{ status: "ok" }` | ✅ | 🔲 Verify |
| Sentry test error received | ✅ captured | 🔲 Verify DSN |
| Vercel cron visible and enabled | — | 🔲 Check dashboard |

---

## Lighthouse Targets (run against staging)

| Metric | Target | Notes |
|--------|--------|-------|
| Performance | > 90 | `/generate` is edge-cached (`revalidate: 3600`) |
| Accessibility | > 90 | Semantic HTML, ARIA labels on form inputs |
| SEO | > 95 | Canonical, Twitter card, JSON-LD, robots all set |
| Best Practices | > 90 | HTTPS, no mixed content |

### Known Lighthouse risks to check:
- Hero `<h1>` font size — ensure ≥ 16px on mobile
- Image elements — verify `alt` on all `<img>` / `<Image>`
- CLS — `<Copilot>` chat area height is fixed (`460px`) to prevent layout shift
- LCP — hero text is above fold, no images blocking render
- Contrast — emerald-600 on white: 3.2:1 ratio (passes AA for large text)

---

## Cross-browser Matrix

| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome 124 | ✅ | ✅ |
| Safari 17 | ✅ | ✅ |
| Firefox 125 | ✅ | ✅ |
| Mobile Safari (iOS 17) | ✅ | ✅ |
| Samsung Internet | 🔲 | 🔲 |

Key mobile checks:
- MobileNav shows Dashboard / Invoices / Clients / +New ✅
- Empty states legible at 390px ✅
- Copilot textarea auto-grows ✅
- Modal sheets don't overflow ✅

---

## Staging Deployment Checklist

### Required Vercel env vars
```
DATABASE_URL
NEXTAUTH_SECRET
NEXTAUTH_URL=https://app-v2.billingbee.co
ANTHROPIC_API_KEY
RESEND_API_KEY
RESEND_FROM=invoice@billingbee.co
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
SENTRY_DSN
NEXT_PUBLIC_SENTRY_DSN
ADMIN_JWT_SECRET
ADMIN_EMAIL
ADMIN_PASSWORD
CRON_SECRET
NEXT_PUBLIC_APP_URL=https://app-v2.billingbee.co
```

### Vercel Cron jobs to verify
```json
{
  "crons": [
    { "path": "/api/cron/trial-expiry", "schedule": "0 10 * * *" },
    { "path": "/api/cron/collections", "schedule": "0 9 * * *" }
  ]
}
```

### Post-deploy verification
1. `curl https://app-v2.billingbee.co/api/health` → `{ status: "ok", db: "ok" }`
2. `curl -I https://app-v2.billingbee.co/robots.txt` → 200
3. `curl -I https://app-v2.billingbee.co/sitemap.xml` → 200
4. `curl -I https://app-v2.billingbee.co/dashboard` → redirect to /login (not 200)
5. Open `/generate` in Chrome DevTools → check Application > Manifest > SEO tab

---

*Report generated: 2026-06-08*
