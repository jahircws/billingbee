# BillingBee v2.0 — Beta Testing Checklist

Beta accounts: `beta+1@billingbee.co` … `beta+10@billingbee.co`  
Password: `BetaTest2025!` (set via `BETA_PASSWORD` env var when seeding)

Seed: `npm run beta:seed:dry` then `npm run beta:seed`

---

## Core Flows

### Anonymous / Public

- [ ] **`/generate` → PDF (anon)**
  - Visit `/generate`, fill in business name + client + 1 line item
  - Click "Download PDF"
  - Verify PDF opens with correct data, BillingBee watermark on free tier
  - Target: PDF ready < 3s

- [ ] **`/generate` → signup → dashboard**
  - Visit `/generate`, start filling invoice
  - Click "Save & sign up"
  - Complete registration (`/register`)
  - Verify: redirected to `/dashboard`, invoice data preserved or re-enterable
  - Verify: welcome email received

### AI Features

- [ ] **Natural language invoice**
  - On `/dashboard`, open Copilot
  - Type: `"Invoice Acme Corp ₹5,000 for logo design"`
  - Verify: AI fills invoice form with correct client, amount, description
  - Check: response < 2s first token

- [ ] **Upload screenshot → invoice extraction**
  - On `/generate`, click the paperclip/upload icon
  - Upload a screenshot of any invoice or receipt
  - Verify: line items, amounts, dates auto-populated
  - Check: extraction < 5s

### Collections

- [ ] **Collections cron — manual trigger**
  - Ensure there is at least 1 OVERDUE invoice (seeded accounts have 2 each)
  - POST to `/api/cron/collections` with header `Authorization: Bearer {CRON_SECRET}`
  - Verify: response `{ sent: N }` with N > 0
  - Check email inbox for collection email

### Payments

- [ ] **Razorpay sandbox payment**
  - Open an UNPAID invoice, click "Send payment link"
  - Open the `/pay/[token]` URL
  - Click Razorpay, use test card `4111 1111 1111 1111`, CVV `123`, any future date
  - Verify: invoice status changes to PAID
  - Verify: payment receipt email sent to client
  - Verify: payment received email sent to staff

- [ ] **Client portal login + pay**
  - Go to a client detail page → click "Invite to portal"
  - Check email for portal invite link
  - Open portal link, set password, log in
  - Verify: client sees their invoices
  - Pay an UNPAID invoice via portal
  - Verify: status updates, receipt email sent

### Admin Panel

- [ ] **Admin panel impersonation**
  - Visit `/admin/login` (create admin user if needed: see `scripts/create-admin.ts`)
  - Go to `/admin/orgs` → find a beta account → click "View →"
  - Click "Impersonate"
  - Verify: redirected to `/dashboard` as that org's owner
  - Verify: `AdminLog` entry created (check `/admin/orgs/[id]?tab=overview`)

### Infrastructure

- [ ] **Health check**
  - GET `/api/health`
  - Expected response:
    ```json
    { "status": "ok", "db": "ok", "timestamp": "...", "latencyMs": <50 }
    ```
  - Verify: HTTP 200

---

## Mobile (390px viewport)

Test all flows above at 390px width (iPhone 14 viewport).  
Set browser DevTools to "iPhone 14" or equivalent.

- [ ] `/generate` — form usable, preview visible, PDF download works
- [ ] `/dashboard` — all cards visible, copilot opens
- [ ] `/invoices` — table scrollable, status filters work
- [ ] `/pay/[token]` ��� payment buttons visible and tappable
- [ ] Sidebar nav — bottom bar visible, all 7 icons visible
- [ ] `/settings` — all tabs reachable

---

## Performance Spot-Check

Run against staging. Compare against targets:

| Route | Target | Check |
|---|---|---|
| `GET /generate` | < 800ms | [ ] |
| `GET /dashboard` | < 1.5s | [ ] |
| AI first token | < 1s | [ ] |
| `GET /pay/[token]` | < 600ms | [ ] |
| PDF generation | < 3s | [ ] |
| Invoice list (100 items) | < 400ms | [ ] |

Measure with browser DevTools Network tab (disable cache for first visit, enable for second).

---

## Load Test (k6)

```bash
# Install k6 (macOS)
brew install k6

# Dry-run against local
k6 run --env BASE_URL=http://localhost:3000 scripts/load-test.js

# Full run against staging
k6 run --env BASE_URL=https://app-v2.billingbee.co \
       --env BB_SESSION_COOKIE="next-auth.session-token=..." \
       scripts/load-test.js
```

Pass criteria (defined in `scripts/load-test.js`):
- `http_req_duration` p95 < 3000ms ✓
- `http_req_failed` rate < 1% ✓
- `generate_duration` p95 < 800ms ✓
- `dashboard_duration` p95 < 1500ms ✓

---

## Sign-off

| Tester | Date | Pass? | Notes |
|--------|------|-------|-------|
| | | | |
