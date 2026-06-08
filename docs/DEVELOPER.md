# BillingBee — Developer Documentation

> Last updated: 2026-06-08

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Prerequisites & Setup](#4-prerequisites--setup)
5. [Environment Variables](#5-environment-variables)
6. [Database](#6-database)
7. [Authentication](#7-authentication)
8. [App Routes & Pages](#8-app-routes--pages)
9. [API Reference](#9-api-reference)
10. [Server Actions](#10-server-actions)
11. [Data Models](#11-data-models)
12. [AI Integration](#12-ai-integration)
13. [Payment Integrations](#13-payment-integrations)
14. [Email System](#14-email-system)
15. [Client Portal](#15-client-portal)
16. [Admin Panel](#16-admin-panel)
17. [Cron Jobs](#17-cron-jobs)
18. [Rate Limiting & Caching](#18-rate-limiting--caching)
19. [Encryption & Security](#19-encryption--security)
20. [Key Utilities](#20-key-utilities)
21. [Component Library](#21-component-library)
22. [Testing](#22-testing)
23. [Scripts](#23-scripts)
24. [Deployment](#24-deployment)
25. [Plans & Limits](#25-plans--limits)
26. [Multi-tenancy Model](#26-multi-tenancy-model)

---

## 1. Project Overview

BillingBee is a **multi-tenant SaaS invoicing platform** for freelancers and small businesses. It supports invoice creation, quote & proposal management, client portals, AI-driven collections, multi-gateway payment processing, GST/tax compliance, and business health analytics.

**Key capabilities:**
- Create and send invoices, quotes, proposals, and contracts
- Accept payments via Razorpay (India), Stripe, and PayPal
- AI copilot powered by Claude for document generation, tax advice, and cashflow forecasting
- Automated AI-driven collections emails for overdue invoices
- Public client portal with magic-link and password login
- GST-ready tax tracking with CSV export
- Business health score (0–100) with actionable recommendations
- Admin panel with usage analytics and org management

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.7 (App Router) |
| Language | TypeScript 5 |
| UI | React 19, TailwindCSS 4, ShadCN/UI (Radix) |
| Icons | Lucide React |
| Charts | Recharts |
| PDF | @react-pdf/renderer |
| ORM | Prisma 7.8.0 |
| Database | PostgreSQL (via PgBouncer for pooling) |
| Auth | NextAuth v5 (JWT strategy) |
| AI | Anthropic Claude (Haiku 4.5 default, Sonnet 4.6 for heavy tasks) |
| Payments | Razorpay · Stripe · PayPal |
| Email | Resend |
| Caching / Rate Limiting | Upstash Redis |
| Error Tracking | Sentry |
| Analytics | PostHog (optional) |
| File Storage | Supabase Storage or AWS S3 / S3-compatible |
| Deployment | Vercel |
| Testing | Vitest + @testing-library/react |
| Load Testing | K6 |

---

## 3. Project Structure

```
/
├── app/
│   ├── (auth)/                    # Login, register pages
│   ├── (app)/                     # Protected app (dashboard and below)
│   │   ├── dashboard/
│   │   ├── invoices/
│   │   ├── quotes/
│   │   ├── proposals/
│   │   ├── contracts/
│   │   ├── clients/
│   │   ├── expenses/
│   │   ├── reports/
│   │   ├── tax/
│   │   └── settings/
│   ├── (admin)/                   # Admin panel (separate auth)
│   │   └── admin/
│   ├── (marketing)/               # Public landing pages
│   ├── (portal)/                  # Client portal (magic link / password)
│   │   └── portal/[orgSlug]/
│   ├── api/                       # API routes
│   │   ├── auth/[...nextauth]/
│   │   ├── admin/
│   │   ├── ai/
│   │   ├── payments/
│   │   ├── webhooks/
│   │   ├── cron/
│   │   ├── generate/
│   │   ├── reports/
│   │   ├── settings/
│   │   ├── stripe/
│   │   └── invoice/
│   ├── actions/                   # Next.js server actions
│   ├── generate/                  # Public free invoice generator
│   ├── pay/[token]/               # Public payment page
│   └── page.tsx                   # Landing page
├── components/
│   ├── ui/                        # ShadCN base components
│   ├── layout/                    # Topbar, Sidebar, MobileNav
│   ├── ai/                        # Copilot chat
│   ├── dashboard/                 # Dashboard cards, banners
│   ├── invoices/
│   ├── quotes/
│   ├── billing/
│   └── seo/
├── lib/
│   ├── db.ts                      # Prisma client (pooled)
│   ├── auth.ts                    # NextAuth providers
│   ├── admin-auth.ts              # Admin JWT helpers
│   ├── plan.ts                    # Plan limits & caching
│   ├── email.ts                   # Email templates + Resend
│   ├── health.ts                  # Health score calculator
│   ├── collections-worker.ts      # AI collection email worker
│   ├── payment-token.ts           # Payment link JWT
│   ├── gateway-config.ts          # Encrypted gateway credential helpers
│   ├── crypto.ts                  # AES-256-GCM encrypt/decrypt
│   ├── rate-limit.ts              # Upstash rate limiting
│   ├── redis-cache.ts             # Redis caching helpers
│   ├── currency.ts                # Currency formatting
│   ├── session.ts                 # Session helpers
│   ├── utils.ts
│   ├── metadata.ts
│   ├── serialize.ts
│   └── sanitize.ts
├── prisma/
│   ├── schema.prisma              # Full schema
│   ├── seed.ts                    # Seed script
│   └── migrations/
├── scripts/                       # Operational & dev scripts
├── __tests__/                     # Vitest test suite
├── docs/                          # Documentation
├── public/                        # Static assets
├── middleware.ts                  # Route protection
├── auth.config.ts                 # NextAuth config
├── auth.ts                        # NextAuth initialization
├── next.config.ts                 # Next.js config (CSP, redirects)
├── vercel.json                    # Cron job definitions
├── tailwind.config.js
├── tsconfig.json
└── vitest.config.ts
```

---

## 4. Prerequisites & Setup

**System requirements:**
- Node.js 20+
- PostgreSQL 15+
- An Upstash Redis instance
- A Resend account (email)
- An Anthropic API key

**Local setup:**

```bash
# 1. Clone and install dependencies
git clone <repo>
cd Billingbee-Claude
npm install

# 2. Copy environment file and fill in values
cp .env.local.example .env.local

# 3. Run database migrations
npx prisma migrate deploy

# 4. Seed the database (admin user + demo org)
npx prisma db seed

# 5. Start the dev server
npm run dev
```

The app runs at `http://localhost:3000`.

**Path alias:** `@/` maps to the project root. Use it for all imports.

---

## 5. Environment Variables

All variables go in `.env.local`. Prefix `NEXT_PUBLIC_` exposes them to the browser.

### App

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | ✅ | Full URL, e.g. `https://billingbee.co` |
| `NEXT_PUBLIC_APP_NAME` | ✅ | Display name |
| `NODE_ENV` | ✅ | `development` or `production` |

### Database

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Pooled connection string (PgBouncer) |
| `DATABASE_DIRECT_URL` | ✅ | Direct connection for Prisma migrations |

### Authentication

| Variable | Required | Description |
|---|---|---|
| `AUTH_SECRET` | ✅ | 32+ char random string (`openssl rand -base64 32`) |
| `AUTH_URL` | ✅ | Same as `NEXT_PUBLIC_APP_URL` |
| `ADMIN_JWT_SECRET` | ✅ | Admin panel JWT secret (32+ chars) |
| `ENCRYPTION_KEY` | ✅ | AES-256 key for payment gateway configs |
| `INVOICE_ENCRYPTION_KEY` | ✅ | AES-256 key for invoice sensitive data |
| `AUTH_GOOGLE_ID` | Optional | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Optional | Google OAuth secret |
| `AUTH_GITHUB_ID` | Optional | GitHub OAuth client ID |
| `AUTH_GITHUB_SECRET` | Optional | GitHub OAuth secret |

### AI

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ | `sk-ant-...` |
| `ANTHROPIC_MODEL` | Optional | Default: `claude-haiku-4-5` |

### Payments — Razorpay

| Variable | Required | Description |
|---|---|---|
| `RAZORPAY_KEY_ID` | ✅ | `rzp_live_...` |
| `RAZORPAY_KEY_SECRET` | ✅ | Razorpay secret |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | ✅ | Same as above (exposed to browser) |
| `RAZORPAY_WEBHOOK_SECRET` | ✅ | Webhook verification secret |

### Payments — Stripe

| Variable | Required | Description |
|---|---|---|
| `STRIPE_SECRET_KEY` | ✅ | `sk_live_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | ✅ | `whsec_...` |

### Payments — PayPal

| Variable | Required | Description |
|---|---|---|
| `PAYPAL_CLIENT_ID` | ✅ | PayPal app client ID |
| `PAYPAL_CLIENT_SECRET` | ✅ | PayPal app secret |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | ✅ | Same (exposed to browser) |
| `PAYPAL_MODE` | ✅ | `sandbox` or `live` |

### Email

| Variable | Required | Description |
|---|---|---|
| `RESEND_API_KEY` | ✅ | `re_...` |
| `RESEND_FROM` | ✅ | Sending address, e.g. `invoices@billingbee.co` |
| `EMAIL_FROM_NAME` | Optional | Display name (default: `BillingBee`) |

### Caching & Rate Limiting

| Variable | Required | Description |
|---|---|---|
| `UPSTASH_REDIS_REST_URL` | ✅ | Upstash REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | Upstash REST token |

### File Storage

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | Optional | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Optional | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Supabase service role key |
| `S3_BUCKET_NAME` | Optional | S3 bucket name |
| `S3_REGION` | Optional | e.g. `ap-south-1` |
| `S3_ACCESS_KEY_ID` | Optional | S3 access key |
| `S3_SECRET_ACCESS_KEY` | Optional | S3 secret |
| `S3_ENDPOINT` | Optional | Leave blank for AWS; set for Supabase/R2 |

### Monitoring

| Variable | Required | Description |
|---|---|---|
| `SENTRY_DSN` | Optional | Server-side Sentry DSN |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional | Client-side Sentry DSN |
| `SENTRY_ORG` | Optional | Sentry org slug |
| `SENTRY_PROJECT` | Optional | Sentry project name |
| `SENTRY_AUTH_TOKEN` | Optional | For source map uploads |
| `NEXT_PUBLIC_POSTHOG_KEY` | Optional | PostHog project key |
| `NEXT_PUBLIC_POSTHOG_HOST` | Optional | PostHog host URL |

### Security

| Variable | Required | Description |
|---|---|---|
| `CRON_SECRET` | ✅ | Secures `/api/cron/*` — `openssl rand -hex 32` |

---

## 6. Database

### ORM

Prisma 7.8.0. Schema at `prisma/schema.prisma`. Generated client at `lib/generated/prisma/`.

```bash
# Run migrations
npx prisma migrate deploy

# Create a new migration
npx prisma migrate dev --name <migration_name>

# Open Prisma Studio
npx prisma studio

# Regenerate client
npx prisma generate

# Seed
npx prisma db seed
```

### Connection Pooling

The app uses PgBouncer for connection pooling via `DATABASE_URL`. Set `DATABASE_DIRECT_URL` for migration commands that need a direct connection.

The Prisma client is instantiated once and cached on the global object in development to avoid hot-reload connection exhaustion (`lib/db.ts`).

### Schema Overview

**Core models:**

| Model | Purpose |
|---|---|
| `Organization` | Tenant root — every record is scoped to an org |
| `User` | Auth identity for staff |
| `OrgUser` | Membership pivot (User ↔ Org) with role |
| `Client` | Customer/contact belonging to an org |
| `Invoice` | Invoice with line items and payment tracking |
| `InvoiceItem` | Line items on an invoice |
| `Quote` | Quote (convertible to invoice) |
| `QuoteItem` | Line items on a quote |
| `Proposal` | Multi-section proposal (JSON sections + pricing) |
| `Contract` | E-signable contract linked to a proposal |
| `Payment` | Payment record for any gateway |
| `PaymentGatewayConfig` | Per-org encrypted gateway credentials |
| `CollectionEvent` | Scheduled AI-driven collection email |
| `ClientPortalUser` | Magic-link / password portal auth per client |
| `Expense` | Expense entry with category |
| `Item` | Product/service catalog |
| `Category` | Category for items and expenses |
| `Tax` | Tax rate definitions (GST etc.) |
| `AdminUser` | Admin panel user |
| `AdminLog` | Audit log for admin actions |
| `AIUsageLog` | Per-request AI token usage tracking |
| NextAuth models | `Account`, `Session`, `VerificationToken` |

**Enums:**

| Enum | Values |
|---|---|
| `OrgRole` | `OWNER`, `MEMBER`, `VIEWER` |
| `AdminRole` | `SUPER_ADMIN`, `SUPPORT`, `BILLING` |
| `InvoiceStatus` | `DRAFT`, `UNPAID`, `PAID`, `OVERDUE` |
| `QuoteStatus` | `DRAFT`, `SENT`, `ACCEPTED`, `REJECTED`, `EXPIRED` |
| `PaymentMethod` | `RAZORPAY`, `STRIPE`, `PAYPAL`, `BANK_TRANSFER`, `CASH`, `CHEQUE`, `OTHER` |
| `Currency` | `INR`, `USD`, `EUR`, `GBP`, `AUD`, `CAD`, `SGD`, `AED` |
| `CollectionTone` | `FRIENDLY`, `REMINDER`, `FIRM`, `ESCALATE` |
| `CollectionStatus` | `PENDING`, `SENT`, `SKIPPED`, `CANCELLED`, `FAILED` |

---

## 7. Authentication

### Staff Auth (NextAuth v5)

Strategy: JWT. Configured in `auth.config.ts`, initialized in `auth.ts`.

**Three credential providers:**

1. **`staff`** — Email + password login for app users
   - Looks up `User` by email
   - Verifies bcryptjs password hash
   - Loads the first active `OrgUser` + org
   - Token payload: `userType: "STAFF"`, `userId`, `orgId`, `role`, `orgName`, `orgSlug`

2. **`client`** — Magic-link token for client portal
   - Looks up `ClientPortalUser` by token
   - Validates expiry
   - Token payload: `userType: "CLIENT"`, `clientId`, `orgId`

3. **`client-password`** — Email + password for client portal
   - Org-scoped lookup in `ClientPortalUser`
   - Token payload: same as `client`

**Callbacks:**
- `jwt()` — Copies provider result fields into the JWT token
- `session()` — Populates `session.user` from the token

**Usage in server components / actions:**

```typescript
import { auth } from "@/auth"

const session = await auth()
if (!session?.user?.orgId) redirect("/login")
const { orgId, userId, role } = session.user
```

### Admin Auth

Separate JWT stored in `admin_session` cookie. 8-hour expiry. Managed by `lib/admin-auth.ts`.

```typescript
import { getAdminSession } from "@/lib/admin-auth"

const admin = await getAdminSession()
if (!admin) redirect("/admin/login")
```

Admin roles: `SUPER_ADMIN`, `SUPPORT`, `BILLING`.

### Middleware (`middleware.ts`)

| Path pattern | Requirement |
|---|---|
| `/admin/*` | Valid `admin_session` cookie |
| `/dashboard/*` and app routes | Staff session (`userType === "STAFF"`) |
| `/portal/*` | Client session (`userType === "CLIENT"`) |
| `/pay/*`, `/blog/*`, marketing pages | Public |
| `/api/webhooks/*` | Public (verified by gateway signature) |

---

## 8. App Routes & Pages

### Public / Marketing

| Route | Description |
|---|---|
| `/` | Landing page |
| `/generate` | Free public invoice generator (AI-powered, no account needed) |
| `/plans-price` | Pricing page |
| `/free-invoice-generator` | Alternative invoice builder |
| `/free-invoice-resources` | Invoice templates and guides |
| `/faq` | FAQ |
| `/contact` | Contact form |

### Auth

| Route | Description |
|---|---|
| `/login` | Staff email/password login |
| `/register` | New org signup |

### Dashboard (Protected — Staff)

| Route | Description |
|---|---|
| `/dashboard` | Overview — attention cards, health score, revenue chart |
| `/invoices` | Invoice list with filters and bulk actions |
| `/invoices/new` | Create invoice (form or AI-guided) |
| `/invoices/[id]` | Invoice detail, PDF, payment tracking, collections tab |
| `/quotes` | Quote list |
| `/quotes/new` | Create quote |
| `/quotes/[id]` | Quote detail — view, send, convert to invoice |
| `/proposals` | Proposal list |
| `/proposals/[id]` | Proposal detail — send, convert to contract |
| `/contracts/[id]` | Contract detail — signature verification |
| `/clients` | Client directory |
| `/clients/[id]` | Client detail — pipeline timeline, invoice history |
| `/expenses` | Expense tracker |
| `/reports` | Analytics — revenue, tax, outstanding, cashflow |
| `/reports/cashflow` | AI-powered cashflow forecast |
| `/tax` | GST compliance and AI tax chat |
| `/settings` | Org settings — profile, taxes, items, payment gateways |

### Admin Panel (Protected — Admin JWT)

| Route | Description |
|---|---|
| `/admin/login` | Admin credential login |
| `/admin` | Overview — orgs, users, MRR, AI usage, signup chart |
| `/admin/orgs` | Organization list, search, suspend/enable |
| `/admin/orgs/[id]` | Org detail — members, invoices, usage, actions |
| `/admin/ai` | AI usage analytics and cost breakdown |
| `/admin/revenue` | Revenue analytics — MRR, churn, LTV |

### Client Portal (Magic Link or Password)

| Route | Description |
|---|---|
| `/portal/[orgSlug]/login` | Client login |
| `/portal/[orgSlug]/dashboard` | Client view of their invoices and quotes |
| `/portal/[orgSlug]/invoice/[id]` | Invoice detail with payment CTA |
| `/portal/[orgSlug]/quote/[id]` | Quote view — accept/reject |
| `/portal/[orgSlug]/proposal/[id]` | Proposal view and acceptance |
| `/portal/[orgSlug]/contract/[id]` | Contract view and e-signature |
| `/portal/[orgSlug]/accept` | Acceptance confirmation page |

### Public Payment Page

| Route | Description |
|---|---|
| `/pay/[token]` | Payment page — Razorpay / Stripe / PayPal |

---

## 9. API Reference

All API routes are under `app/api/`. JSON responses use `NextResponse.json()`.

### Authentication

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/auth/[...nextauth]` | NextAuth v5 handler (login, logout, session) |

### Admin

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/admin/login` | Admin email/password → JWT cookie |
| `POST` | `/api/admin/logout` | Clear `admin_session` cookie |
| `POST` | `/api/admin/org-action` | Suspend, enable, or export an org |

### AI

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/ai/copilot` | Chat assistant with invoice/quote context |
| `POST` | `/api/ai/extract` | Extract structured invoice data from text or image |
| `POST` | `/api/ai/tax` | GST/tax compliance advice |
| `POST` | `/api/ai/cashflow` | Predictive cashflow analysis |
| `POST` | `/api/ai/health` | Business health scoring |

### Settings

| Method | Route | Description |
|---|---|---|
| `GET/POST` | `/api/settings/profile` | User profile (name, image, email) |
| `GET/POST` | `/api/settings/org` | Organization metadata |
| `GET/POST` | `/api/settings/taxes` | Tax rate list |
| `GET/PUT/DELETE` | `/api/settings/taxes/[id]` | Individual tax management |
| `GET/POST` | `/api/settings/items` | Product/service catalog |
| `GET/PUT/DELETE` | `/api/settings/items/[id]` | Individual item management |
| `GET` | `/api/settings/gateways` | List configured payment gateways |
| `POST` | `/api/settings/gateways` | Create or update gateway config (encrypted) |
| `POST` | `/api/settings/gateways/test` | Test gateway connectivity |

### Payment Processing

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/payments/razorpay/create-order` | Create Razorpay order |
| `POST` | `/api/payments/razorpay/verify` | Verify HMAC-SHA256 signature, mark invoice PAID |
| `POST` | `/api/payments/stripe/create-session` | Create Stripe Checkout session |
| `POST` | `/api/payments/paypal/create-order` | Create PayPal order |
| `POST` | `/api/payments/paypal/capture-order` | Capture PayPal payment |

### Payment Webhooks

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/webhooks/stripe` | Handle `payment_intent.succeeded` |
| `POST` | `/api/webhooks/razorpay` | Verify and process Razorpay webhook |
| `POST` | `/api/webhooks/paypal` | Handle PayPal webhook |

### Stripe Billing (Subscriptions)

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/stripe/checkout` | Create subscription checkout session |
| `POST` | `/api/stripe/checkout-redirect` | Handle post-checkout redirect |
| `POST` | `/api/stripe/portal` | Link to Stripe customer billing portal |

### Document Generation

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/generate/pdf` | Generate PDF for invoice/quote (rate-limited: 5/hr) |
| `POST` | `/api/generate/document` | Generate contract or proposal |
| `POST` | `/api/generate/extract` | Extract data from uploaded files |
| `POST` | `/api/generate/suggest` | AI content suggestions for invoice fields |

### Reports & Tax

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/reports/cashflow-data` | AI-powered cashflow forecast data |
| `POST` | `/api/tax/export-csv` | Export tax summary as CSV |

### Invoice

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/invoice/[id]/pay-link` | Generate JWT-signed payment link token |

### Cron (Vercel — Bearer token protected)

| Method | Route | Schedule | Description |
|---|---|---|---|
| `GET` | `/api/cron/collections` | 09:00 UTC daily | Run AI collection email worker |
| `GET` | `/api/cron/trial-expiry` | 10:00 UTC daily | Downgrade expired trial orgs |
| `GET` | `/api/health` | 00:00 UTC weekly (Sun) | System health check |

Cron routes require `Authorization: Bearer <CRON_SECRET>` header (set automatically by Vercel).

---

## 10. Server Actions

Located in `app/actions/`. Called directly from React Server Components or `<form action={...}>`.

| File | Key Exports |
|---|---|
| `invoices.ts` | `createInvoice`, `updateInvoice`, `sendInvoice`, `duplicateInvoice`, `deleteInvoice` |
| `quotes.ts` | `createQuote`, `updateQuote`, `sendQuote`, `convertQuoteToInvoice`, `deleteQuote` |
| `proposals.ts` | `createProposal`, `updateProposal`, `sendProposal`, `convertToContract` |
| `contracts.ts` | `createContract`, `signContract`, `deleteContract` |
| `clients.ts` | `createClient`, `updateClient`, `deleteClient`, `inviteClientPortal` |
| `expenses.ts` | `createExpense`, `updateExpense`, `deleteExpense` |
| `collections.ts` | `scheduleCollections` (called on invoice sent, schedules events at +1/7/15/30/45/90 days) |
| `portal.ts` | `acceptProposal`, `signContract`, `acceptQuote`, `rejectQuote` |
| `auth.ts` | `registerOrganization`, `sendMagicLink`, `verifyMagicLink` |

---

## 11. Data Models

### Organization

```typescript
{
  id: string
  slug: string              // URL-safe identifier, used in portal routes
  name: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  country?: string
  pincode?: string
  gstin?: string            // GST number (India)
  pan?: string
  logo?: string
  currency: Currency        // Default currency
  timezone: string
  plan: string              // "free" | "starter" | "pro" | "enterprise"
  planExpiry?: Date
  stripeCustomerId?: string
  isActive: boolean
  acquisitionSource?: string
  createdAt: Date
  updatedAt: Date
}
```

### Invoice

```typescript
{
  id: string
  orgId: string
  clientId: string
  invoiceNumber: string
  status: InvoiceStatus     // DRAFT | UNPAID | PAID | OVERDUE
  issueDate: Date
  dueDate: Date
  currency: Currency
  subtotal: Decimal
  taxAmount: Decimal
  discountAmount: Decimal
  total: Decimal
  amountPaid: Decimal
  amountDue: Decimal
  notes?: string
  terms?: string
  pdfUrl?: string
  sentAt?: Date
  paidAt?: Date
  viewedAt?: Date
  reminderSentAt?: Date
  isRecurring: boolean
  recurringCron?: string    // Cron expression for recurring invoices
  autoFollowUp: boolean     // Enable AI collection emails
  aiPrompt?: string
  items: InvoiceItem[]
  payments: Payment[]
}
```

### Client

```typescript
{
  id: string
  orgId: string
  name: string
  slug: string
  email?: string
  phone?: string
  company?: string
  gstin?: string
  pan?: string
  address?: string
  city?: string
  state?: string
  country?: string
  pincode?: string
  currency?: Currency
  notes?: string
  isActive: boolean
}
```

### Payment

```typescript
{
  id: string
  orgId: string
  invoiceId: string
  clientId: string
  amount: Decimal
  currency: Currency
  method: PaymentMethod
  gatewayPaymentId?: string
  gatewayOrderId?: string
  gatewaySignature?: string
  status: string            // "pending" | "captured" | "failed"
  paidAt?: Date
  notes?: string
}
```

### CollectionEvent

```typescript
{
  id: string
  orgId: string
  invoiceId: string
  dayNumber: number         // 1, 7, 15, 30, 45, or 90 days after due date
  tone: CollectionTone      // FRIENDLY → REMINDER → FIRM → ESCALATE
  status: CollectionStatus
  scheduledAt: Date
  sentAt?: Date
  subject?: string
  htmlBody?: string
  textBody?: string
  errorMsg?: string
}
```

### PaymentGatewayConfig

```typescript
{
  id: string
  orgId: string
  gateway: string           // "razorpay" | "stripe" | "paypal"
  isActive: boolean
  encryptedConfig: string   // AES-256-GCM encrypted JSON blob
  webhookSecret?: string
}
```

---

## 12. AI Integration

The app uses Anthropic's Claude via `@anthropic-ai/sdk`.

**Default model:** `claude-haiku-4-5` (fast, low cost).
**Heavy tasks:** `claude-sonnet-4-6` configurable via `ANTHROPIC_MODEL`.

### Endpoints

| Endpoint | Model | Use case |
|---|---|---|
| `/api/ai/copilot` | Haiku | Interactive chat for invoice/quote drafting |
| `/api/ai/extract` | Haiku | Extract structured data from text or uploaded documents |
| `/api/ai/tax` | Haiku | GST/tax compliance Q&A |
| `/api/ai/cashflow` | Haiku | Cash flow prediction and scenario modeling |
| `/api/ai/health` | Haiku | Business health scoring and recommendations |

### Collection Emails (`lib/collections-worker.ts`)

Called by `/api/cron/collections` daily. For each pending `CollectionEvent`:

1. Loads invoice + client context
2. Determines tone based on `dayNumber` (friendly early, escalating over time)
3. Sends structured prompt to Claude requesting subject + HTML + text
4. Sends email via Resend
5. Updates `CollectionEvent.status` to `SENT` or `FAILED`

### AI Usage Logging

Every AI call writes to `AIUsageLog`:

```typescript
{
  orgId?: string    // null for public/unauthenticated calls
  type: string      // "copilot" | "extract" | "generate" | "cashflow" | "collection"
  model: string
  inputTokens: number
  outputTokens: number
  createdAt: Date
}
```

Visible in the admin panel at `/admin/ai`.

### Rate Limits on AI Endpoints

| Endpoint | Limit |
|---|---|
| `/api/ai/copilot` | 30 requests/hour per org |
| `/api/generate/suggest` | 20 requests/hour per IP |
| `/api/generate/pdf` | 5 requests/hour per IP |
| `/api/generate/extract` (public) | 10 requests/hour per IP |
| `/api/generate/extract` (authenticated) | 10 requests/day per org |

---

## 13. Payment Integrations

### Overview

All payment gateway credentials are stored **encrypted** (AES-256-GCM) in `PaymentGatewayConfig` per org. Retrieve them with helpers from `lib/gateway-config.ts`:

```typescript
const config = await getRazorpayConfig(orgId)    // { keyId, keySecret }
const config = await getStripeConfig(orgId)      // { publishableKey, secretKey, webhookSecret }
const config = await getPaypalConfig(orgId)      // { clientId, clientSecret, mode }
```

### Razorpay (India — Primary)

- **Create order:** `POST /api/payments/razorpay/create-order` → returns `orderId`
- **Frontend:** Load Razorpay Checkout JS, pass `orderId`
- **Verify:** `POST /api/payments/razorpay/verify` — validates HMAC-SHA256 signature, creates `Payment` record, marks invoice `PAID`
- **Webhook:** `POST /api/webhooks/razorpay` — alternate verification path
- Methods: UPI, cards, net banking, wallets

### Stripe (International)

- **Create session:** `POST /api/payments/stripe/create-session` → returns Stripe Checkout URL
- **Webhook:** `POST /api/webhooks/stripe` — handles `payment_intent.succeeded`, marks invoice `PAID`
- Invoice `id` and `orgId` passed as Stripe metadata for lookup on webhook

### PayPal

- **Create order:** `POST /api/payments/paypal/create-order`
- **Capture:** `POST /api/payments/paypal/capture-order`
- **Webhook:** `POST /api/webhooks/paypal`
- Supports sandbox and live modes via `PAYPAL_MODE`

### Stripe Subscriptions (BillingBee's Own Billing)

For the app's subscription plans:
- `POST /api/stripe/checkout` — initiates plan subscription checkout
- `POST /api/stripe/portal` — link to Stripe customer portal for self-service
- `stripeCustomerId` stored on `Organization`

### Payment Link Flow

1. Staff calls `POST /api/invoice/[id]/pay-link` → receives a signed JWT token
2. Token is embedded in `/pay/[token]`
3. Client opens the link, selects gateway, pays
4. Webhook marks invoice `PAID`, fires payment receipt email

---

## 14. Email System

Emails are sent via **Resend** (`lib/email.ts`).

### Templates

| Function | Trigger |
|---|---|
| `sendInvoiceSentEmail` | Invoice sent to client |
| `sendPaymentReceivedEmail` | Payment recorded (notify staff) |
| `sendPaymentReceiptEmail` | Payment receipt to client |
| `sendCollectionEmail` | AI-generated overdue reminder |
| Magic link emails | Client portal invite / login |

All templates use a shared HTML layout with a branded header and footer.

### Collection Email Tones by Day

| Day offset | Tone |
|---|---|
| +1 | `FRIENDLY` |
| +7 | `REMINDER` |
| +15 | `FIRM` |
| +30 | `ESCALATE` |
| +45 | `ESCALATE` |
| +90 | `ESCALATE` |

Claude generates the subject, HTML body, and text body for each tone, personalized with client name, amount due, due date, and payment link.

### Testing Emails

```bash
npm run email:test
```

---

## 15. Client Portal

Clients access their documents at `/portal/[orgSlug]/`.

### Access Methods

1. **Magic link** — Staff sends an invite; client receives a single-use token via email. Token expires after a configurable period. Stored in `ClientPortalUser.token`.

2. **Password** — Client sets a password after first magic-link login. Subsequent logins via `client-password` provider.

### What Clients Can Do

- View their invoices, quotes, proposals, and contracts
- Accept or reject quotes and proposals
- E-sign contracts (IP address and timestamp recorded)
- Pay invoices via the embedded payment flow

### E-Signature

When a client signs a contract:
- `Contract.status` → `SIGNED`
- `Contract.signedAt` set to current timestamp
- `Contract.signedBy` set to client name
- `Contract.ipAddress` recorded from the request

---

## 16. Admin Panel

Completely separate auth stack from the main app.

### Access

Login at `/admin/login` with `AdminUser` credentials. Creates `admin_session` JWT cookie (8-hour expiry).

### Capabilities

| Section | What you can do |
|---|---|
| Overview | View total orgs, users, MRR, AI usage, signup trend chart |
| Orgs | List all orgs, search, view details, suspend/enable |
| Org Detail | View members, invoices, usage stats, take actions |
| AI Usage | Per-org token usage, model breakdown, cost estimates |
| Revenue | MRR, churn, LTV analytics |

### Audit Log

Every admin action writes to `AdminLog`:

```typescript
{
  adminId: string
  action: string            // e.g. "suspend_org", "enable_org"
  target: string            // e.g. "Organization"
  targetId: string
  metadata: JSON
  ipAddress: string
  userAgent: string
}
```

---

## 17. Cron Jobs

Defined in `vercel.json`, executed by Vercel Cron.

| Cron | Schedule | Description |
|---|---|---|
| `/api/cron/collections` | `0 9 * * *` | Process pending collection events, send AI emails |
| `/api/cron/trial-expiry` | `0 10 * * *` | Downgrade orgs whose `planExpiry` has passed |
| `/api/health` | `0 0 * * 0` | System health check (DB, Redis, AI, Sentry) |

All cron routes verify `Authorization: Bearer <CRON_SECRET>`.

### Collections Worker Logic

1. Fetch all `CollectionEvent` records where `status = PENDING` and `scheduledAt <= now`
2. For each event, load the invoice and client
3. Skip if invoice is already `PAID` or `autoFollowUp` disabled
4. Generate AI email with appropriate tone
5. Send via Resend
6. Update event status to `SENT` or `FAILED`

---

## 18. Rate Limiting & Caching

### Rate Limiting (`lib/rate-limit.ts`)

Uses Upstash Redis with a sliding window algorithm.

```typescript
const { success } = await checkRateLimit(identifier, limit, window)
if (!success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
```

Limits applied per IP (public endpoints) or per orgId (authenticated endpoints).

### Redis Caching (`lib/redis-cache.ts`)

```typescript
await cacheSet(key, value, ttlSeconds)
const value = await cacheGet(key)
await cacheDel(key)
```

Used for:
- Plan limits (cached per org, invalidated on plan change)
- Invoice/client counters (avoid repeated DB count queries)

---

## 19. Encryption & Security

### AES-256-GCM (`lib/crypto.ts`)

Used for payment gateway credentials and sensitive invoice data.

```typescript
const encrypted = encrypt(plaintext, key)     // returns base64 ciphertext
const plaintext = decrypt(ciphertext, key)    // returns original string
```

Keys: `ENCRYPTION_KEY` (gateway configs), `INVOICE_ENCRYPTION_KEY`.

### JWT Tokens

- **NextAuth staff/client sessions** — HS256, `AUTH_SECRET`
- **Admin sessions** — HS256, `ADMIN_JWT_SECRET`, 8-hour expiry, `admin_session` cookie
- **Payment links** — HS256, `INVOICE_ENCRYPTION_KEY`, short-lived

### Webhook Verification

- **Razorpay** — HMAC-SHA256 on `orderId + "|" + paymentId` using `RAZORPAY_WEBHOOK_SECRET`
- **Stripe** — `stripe.webhooks.constructEvent` with `STRIPE_WEBHOOK_SECRET`
- **PayPal** — PayPal SDK signature validation

### Content Security Policy

Set via `next.config.ts` response headers. Restricts script-src, connect-src, etc. to known domains.

### Row-Level Security

Enforced in application code: every database query includes `orgId: session.user.orgId`. There is no cross-tenant data leakage via application logic. Prisma does not enforce RLS at the DB level — this is purely application-layer.

---

## 20. Key Utilities

### `lib/session.ts`

```typescript
getSession()          // Returns full NextAuth session or null
getOrgId()            // Returns orgId from session or throws
getClientSession()    // Returns client portal session or null
```

### `lib/plan.ts`

```typescript
getActivePlan(orgId)             // Returns plan name with caching
checkInvoiceLimit(orgId)         // Throws if org is at invoice limit
checkClientLimit(orgId)          // Throws if org is at client limit
```

Plan limits by tier are defined as constants in this file.

### `lib/health.ts`

```typescript
calculateHealthScore(orgId)      // Returns { score: number, factors: Factor[] }
```

Scores 5 factors: invoice collection rate, client activity, payment speed, document completion, revenue growth.

### `lib/currency.ts`

```typescript
formatCurrency(amount, currency)  // e.g. "₹1,23,456.78" or "$1,234.56"
```

Handles INR Indian number formatting separately from international standards.

### `lib/gateway-config.ts`

```typescript
getRazorpayConfig(orgId)         // Decrypts and returns Razorpay credentials
getStripeConfig(orgId)           // Decrypts and returns Stripe credentials
getPaypalConfig(orgId)           // Decrypts and returns PayPal credentials
getConfiguredGateways(orgId)     // Returns list of active gateways
```

---

## 21. Component Library

ShadCN/UI with Base Nova style. Components in `components/ui/`:

`Avatar` · `Badge` · `Button` · `Card` · `Command` · `Dialog` · `Dropdown Menu` · `Input` · `Input Group` · `Label` · `Popover` · `Progress` · `Select` · `Separator` · `Sheet` · `Skeleton` · `Table` · `Tabs` · `Textarea` · `Toast (Sonner)`

Import from `@/components/ui/<component>`.

### Key App Components

| Component | Location | Purpose |
|---|---|---|
| `Topbar` | `components/layout/Topbar` | Top nav — org switcher, user menu |
| `Sidebar` | `components/layout/Sidebar` | Main app navigation |
| `MobileNav` | `components/layout/MobileNav` | Mobile hamburger nav |
| `Copilot` | `components/ai/Copilot` | AI chat interface |
| `HealthCard` | `components/dashboard/HealthCard` | Business health score |
| `TrialBanner` | `components/dashboard/TrialBanner` | Trial countdown |
| `GatewayForm` | `components/invoices/GatewayForm` | Payment gateway setup |
| `PlansClient` | `components/billing/PlansClient` | Plan comparison |
| `GSTChat` | `app/(app)/tax/` | AI tax compliance chat |
| `CollectionsTab` | `app/(app)/invoices/[id]/` | Collection event history |

---

## 22. Testing

**Framework:** Vitest + @testing-library/react + @testing-library/jest-dom

```bash
npm run test             # Run all tests once
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

Tests live in `__tests__/`. The test environment is `jsdom`.

**Load testing:**

```bash
npm run load-test        # Run K6 load test suite
```

K6 scripts are in `scripts/load-test.js`.

---

## 23. Scripts

```bash
npm run dev                  # Start Next.js dev server (http://localhost:3000)
npm run build                # Production build
npm run start                # Start production server
npm run lint                 # ESLint

npm run test                 # Unit tests
npm run test:watch           # Watch mode
npm run test:coverage        # Coverage

npm run migrate:dry          # Preview v1 → v2 data migration (no DB changes)
npm run migrate:run          # Execute v1 → v2 data migration

npm run beta:seed:dry        # Preview seeding test beta orgs
npm run beta:seed            # Seed test beta orgs

npm run load-test            # K6 performance test

npm run email:segments       # Export email segments for campaigns (CSV)
npm run email:test           # Send test transactional emails
```

---

## 24. Deployment

### Vercel (Recommended)

1. Import the repository in Vercel
2. Set all environment variables in the Vercel dashboard
3. Set `DATABASE_DIRECT_URL` for migration commands in the build step
4. Cron jobs in `vercel.json` run automatically

**Build command:** `next build`  
**Output:** `next start`

### Database Migrations in CI

Run migrations in the Vercel build hook or GitHub Actions before deploying:

```bash
npx prisma migrate deploy
```

Use `DATABASE_DIRECT_URL` (not `DATABASE_URL`) for migrations to bypass PgBouncer.

### Sentry Source Maps

Upload during build by setting `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT`. The `instrumentation.ts` handles Sentry initialization for server, edge, and client runtimes.

---

## 25. Plans & Limits

Plan limits are enforced in `lib/plan.ts` and checked via server actions before creating documents.

| Feature | Free | Starter | Pro | Enterprise |
|---|---|---|---|---|
| Invoices/month | 5 | 50 | Unlimited | Unlimited |
| Clients | 10 | 100 | Unlimited | Unlimited |
| AI Copilot | ❌ | ✅ | ✅ | ✅ |
| AI Collections | ❌ | ❌ | ✅ | ✅ |
| Client Portal | ❌ | ✅ | ✅ | ✅ |
| Proposals & Contracts | ❌ | ❌ | ✅ | ✅ |
| Multiple gateways | ❌ | ✅ | ✅ | ✅ |

Trial orgs get Pro-level access for 90 days. The `/api/cron/trial-expiry` job downgrades them to Free on expiry.

---

## 26. Multi-tenancy Model

BillingBee is a **shared-infrastructure, application-layer multi-tenant** system.

- Every tenant is an `Organization`
- Every data model (Invoice, Client, Quote, etc.) has an `orgId` foreign key
- All queries are scoped: `where: { orgId }` — enforced in server actions and API routes
- There is no DB-level row-level security; isolation is purely in application code
- `Organization.slug` is unique and used as a URL segment in client portal routes (`/portal/[orgSlug]/`)
- Users can belong to multiple orgs via `OrgUser`; the active org is stored in the JWT session

### Adding a New Multi-tenant Feature

1. Add `orgId String` to the Prisma model
2. Add `@@index([orgId])` for query performance
3. Scope all reads/writes: `prisma.model.findMany({ where: { orgId } })`
4. Extract `orgId` from session via `getOrgId()` at the start of every server action and API route
