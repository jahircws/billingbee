# June 8th Work Log — BillingBee

## 1. Upload Mode on New Invoice Page
- Added drag-and-drop file upload panel to `InvoiceForm` when `?mode=upload` is in the URL
- Calls existing `/api/ai/extract` endpoint (Claude Haiku) to parse PDF/images
- Extracted fields (client name, due date, line items, notes) auto-fill the form
- Dashboard "From Upload" button now works end-to-end

**Files:** `app/(app)/invoices/new/page.tsx`, `components/invoices/InvoiceForm.tsx`

---

## 2. Stripe Payments — Local Testing Setup

### Env vars added to `.env.local`
| Variable | Value |
|---|---|
| `STRIPE_PRICE_PRO_MONTHLY` | `price_1Tg4GwKEXVd0aQMBCbqcahZL` |
| `STRIPE_SECRET_KEY` | `sk_test_51OU1tB...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_51OU1tB...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_27a4b2...` |
| `NEXT_PUBLIC_BASE_URL` | `http://localhost:3000` |
| `ENCRYPTION_KEY` | 64-char hex (AES-256 for gateway config encryption) |

### Bugs fixed
- **Portal return URL** — was `/dashboard/settings`, fixed to `/settings?tab=plan`
- **`NEXT_PUBLIC_BASE_URL` missing** — Stripe success/cancel URLs were pointing to production
- **`ENCRYPTION_KEY` missing** — caused "Network error" when saving gateway keys in Settings → Gateways
- **Invoice payment webhook** — `metadata` was on checkout session but webhook listened to `payment_intent.succeeded` which didn't inherit it. Fixed by adding `payment_intent_data: { metadata }` and adding `checkout.session.completed` as primary handler
- **Pay page cache** — page cached invoice for 5 min; bypassed cache when `?paid=true` is in URL so status updates immediately after payment

**Files:** `app/api/payments/stripe/create-session/route.ts`, `app/api/webhooks/stripe/route.ts`, `app/api/stripe/portal/route.ts`, `app/pay/[token]/page.tsx`

---

## 3. Invoice Row Actions Dropdown Fix
- Dropdown was clipped by `overflow-y-auto` scroll container
- Switched from `position: absolute` to `position: fixed`, anchored via `getBoundingClientRect()`

**File:** `app/(app)/invoices/InvoiceRowActions.tsx`

---

## 4. Currency — Org Default Currency on Invoice Form
- New invoice page now reads `currency` from org settings (was only reading `plan`)
- `InvoiceForm` accepts `defaultCurrency` prop, initialises state from it
- Replaced hardcoded `₹ en-IN` formatter with `Intl.NumberFormat` using selected currency
- Added currency dropdown (USD, EUR, GBP, INR, AUD, CAD, SGD, AED, JPY) in Details section
- Currency is sent with invoice payload on create

**Files:** `app/(app)/invoices/new/page.tsx`, `components/invoices/InvoiceForm.tsx`

---

## 5. Pricing Page — Start Pro / Start Business Flow
- "Start Pro" and "Start Business" buttons now go: **Register → Login → Stripe Checkout**
- `callbackUrl` is threaded through register form → login form → `loginStaff` action
- `loginStaff` now uses `callbackUrl` instead of hardcoding `/dashboard`
- `checkout-redirect` API route fully rewired:
  - Not logged in → `/register?callbackUrl=...`
  - Logged in, free plan → direct Stripe checkout session
  - Already Pro/Business → Stripe billing portal
- Business plan CTA changed from `/contact` to `/api/stripe/checkout-redirect?plan=business`
- `STRIPE_PRICE_BUSINESS_MONTHLY` env var supported (falls back to Pro price if not set)

**Files:** `app/api/stripe/checkout-redirect/route.ts`, `app/(auth)/register/page.tsx`, `app/(auth)/register/register-form.tsx`, `app/(auth)/login/page.tsx`, `app/(auth)/login/login-form.tsx`, `app/actions/auth.ts`, `app/(marketing)/plans-price/PlansClient.tsx`

---

## 6. Email — Resend Domain Verified
- Domain `billingbee.co` verified on Resend
- Updated `RESEND_FROM` from `onboarding@resend.dev` → `BillingBee <hello@billingbee.co>`
- All transactional emails (welcome, invoice sent, payment receipt, follow-ups) now send from `hello@billingbee.co`

**File:** `.env.local`

---

## Email Sequences Inventory
| Sequence | Trigger | Notes |
|---|---|---|
| Welcome | Registration | Fires automatically |
| Invoice sent | Click "Send" on invoice | Manual trigger |
| Payment received | Stripe/Razorpay webhook | Auto, fires on paid |
| Payment receipt (client) | Same webhook | Auto, fires on paid |
| AI follow-up / collections | Cron `/api/cron/collections` | Needs overdue invoice |
| Portal invite | Invite client to portal | Manual trigger |
| Contract sent | Send contract | Manual trigger |
| Proposal sent | Send proposal | Manual trigger |
| Trial expiry | Cron `/api/cron/trial-expiry` | Scheduled |

---

## Git Commit
```
84ebaaf — Stripe local tested, email tested
```
15 files changed, 313 insertions, 81 deletions
