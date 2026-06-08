This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Data Migration

> ⚠️ **ALWAYS run `migrate:dry` first. Fix any errors. Then run `migrate:run`.**

The migration script moves verified users from the old system into BillingBee v2.0.

### Setup

Set both database URLs before running:

```bash
export OLD_DATABASE_URL="postgres://user:pass@old-host/old_db"
export DATABASE_URL="postgres://user:pass@new-host/billingbee_v2"
```

### Step 1 — Dry run (mandatory)

```bash
npm run migrate:dry
```

This will:
- Connect to the old DB (read-only)
- Print exactly what would be migrated: N users, M clients, K invoices
- Export `scripts/unverified-emails.csv` for relaunch campaign Segment C
- Write **nothing** to the new DB

Review the output. If there are errors or count mismatches, fix them before proceeding.

### Step 2 — Live run

```bash
npm run migrate:run
```

This will:
- Migrate all 695 verified users, their clients, and invoices
- Create each org with a 90-day Pro trial (`planExpiry = now + 90d`)
- Set a temporary password `ChangeMe123!` — users must change on first login
- Run post-migration verification (org/client/invoice counts must match)
- Print `VERIFICATION PASSED ✓` on success, or throw with details on failure

### What gets migrated

| Old | New |
|-----|-----|
| `users` (verified) | `Organization` + `User` + `OrgUser` (OWNER) |
| `clients` | `Client` (scoped to org) |
| `invoices` + `invoice_items` | `Invoice` + `InvoiceItem` |

Each org also gets seeded with default taxes (GST 5/12/18%) and expense categories.

### Unverified users

Unverified emails are exported to `scripts/unverified-emails.csv` for the relaunch campaign (Segment C). They are **not** migrated to the new DB.

---

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
