# BillingBee v2.0 Pre-Launch Checklist

## Auth & Security
- [ ] NextAuth secret set in production (`NEXTAUTH_SECRET`)
- [ ] Admin JWT secret set (`ADMIN_JWT_SECRET`, min 32 chars)
- [ ] All DB queries verified to scope by `orgId` from session
- [ ] Impersonation tokens expire after 1 hour (verified in admin route)
- [ ] `admin_session` cookie is `httpOnly`, `sameSite: strict`
- [ ] Cron routes protected with `Authorization: Bearer {CRON_SECRET}`

## Infrastructure
- [ ] `DATABASE_URL` points to production Postgres (prisma+postgres proxy)
- [ ] `npx prisma db push` run on production schema
- [ ] `npx prisma generate` run after schema push
- [ ] Upstash Redis provisioned (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`)
- [ ] Sentry DSN configured (`SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN`)

## Email
- [ ] Resend API key set (`RESEND_API_KEY`)
- [ ] From address verified in Resend (SPF/DKIM configured)
- [ ] All email sends are fire-and-forget (`.catch(() => {})`)
- [ ] Portal invite email tested end-to-end
- [ ] Trial expiry email tested (cron at `/api/cron/trial-expiry`)

## Payments
- [ ] Stripe keys set (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`)
- [ ] Stripe webhook secret set (`STRIPE_WEBHOOK_SECRET`)
- [ ] Razorpay keys set (if applicable)
- [ ] Payment webhooks tested with Stripe CLI

## AI
- [ ] Anthropic API key set (`ANTHROPIC_API_KEY`)
- [ ] AI rate limiting tested (per-org)
- [ ] `AIUsageLog` entries being written on every AI call

## Performance
- [ ] `/api/health` endpoint returns `{ status: "ok", db: "ok" }`
- [ ] k6 load test passes: p95 < 3s, error rate < 1% at 200 VUs
- [ ] Pay page (`/pay/[token]`) edge-cached (verify `Cache-Control` header)
- [ ] Redis cache TTLs are reasonable (plan: 5 min, invoice: 5 min)

## Onboarding & UX
- [ ] Zero-state tested: new org sees onboarding Copilot message + suggestions
- [ ] Email verify banner shown for unverified users; dismissed state persists
- [ ] Generate signup banner shown for SEO/generate users
- [ ] Trial banner dismisses and reappears correctly
- [ ] Mobile nav shows: Dashboard, Invoices, Clients, +New (at 390px)
- [ ] Empty states on: Invoices, Clients, Quotes, Reports all show CTAs

## SEO & Acquisition
- [ ] `/generate` page reads `utm_source`, `utm_campaign` from URL → `localStorage`
- [ ] Register form reads `bb_acquisition` from `localStorage` → hidden field
- [ ] Redirects working: `/register-now → /generate`, `/login-now → /login`
- [ ] Pricing page at `/plans-price` renders with INR/USD toggle

## Admin Panel
- [ ] `/admin/login` form works with `ADMIN_EMAIL` + `ADMIN_PASSWORD`
- [ ] Org impersonation creates `AdminLog` entry
- [ ] AI usage dashboard shows real data from `AIUsageLog`

## Data Migration (for production launch)
- [ ] Run `ts-node --project tsconfig.scripts.json scripts/migrate.ts --dry-run` first
- [ ] Review dry-run output — 0 collisions
- [ ] Run without `--dry-run` only after dry-run passes all assertions
- [ ] Verify post-migration counts match pre-migration source
