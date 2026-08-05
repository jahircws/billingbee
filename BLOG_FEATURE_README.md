# Blog Feature — Handoff Notes

Summary of the blog listing (`/blogs`) and blog details (`/blogs/{slug}`) feature built for BillingBee, plus the legacy data import, for whoever picks this up next.

---

## 1. What's been done

### Database / Prisma
- Added three models to `schema.prisma`: `BlogCategory`, `Blog`, `Media`.
- **Table and column names intentionally match the legacy MySQL schema exactly** — same table names (`blog_categories`, `blogs`, `media`), same column names, including the legacy `meta_decription` typo and the `category` column (kept as a raw JSON-array-of-ids text field, *not* a new relational pivot table).
- `tenant_id` is `String?` (UUID), not `Int?` — the legacy data uses UUIDs (e.g. `9ebfa566-7623-4a41-81e3-107abbb7d291`), confirmed from the real `blog_categories.csv` export.
- `Media` mirrors the existing Spatie-style polymorphic media table (`model_type` / `model_id`). If a `Media` model already existed in the project, the new one should be skipped/merged rather than duplicated.
- Schema was applied with `npx prisma db push` (not `migrate dev`, per environment restrictions — no migration history files were generated as a result; be aware of drift if this project later adopts tracked migrations).

### Legacy data import — CSV-based (final approach)
- Live-MySQL-connection import was dropped in favor of importing from **CSV exports** (`blog_categories.csv`, `blogs.csv`, `media.csv`), since those exports were already available and it avoids opening a connection to the old DB at all.
- Script: `scripts/import-from-csv.ts`. Reads CSVs from a folder (`CSV_DIR` env var, defaults to `.`) using `csv-parse/sync`, and upserts into Postgres via raw SQL (`INSERT ... ON CONFLICT (id) DO UPDATE`).
- **Primary keys are preserved as-is** (no id remapping) since the schema is identical — this keeps `category` JSON arrays on blogs and `model_id` on media pointing at the correct rows with no translation step.
- Safe to re-run — upserts by original `id`, won't duplicate rows.
- Empty CSV cells are explicitly treated as `NULL` (not empty string) via a small `n()` helper in the script.
- Postgres sequences are resynced after each table's import (`setval(...)`) since ids are inserted explicitly — otherwise the next auto-generated insert from the app would collide with an imported row.
- Run with: `CSV_DIR=./legacy-csv npx tsx --env-file=.env scripts/import-from-csv.ts` (see §2).
- **Not needed at runtime** — one-off. `csv-parse` can stay as a devDependency; the script and CSV folder can be deleted once the import has run successfully in production.
- *(An earlier version of this script connected directly to the legacy MySQL DB via `mysql2`. That approach was replaced — `mysql2` is no longer a dependency.)*

### Application code
- `lib/prisma.ts` — Prisma client singleton, using `@prisma/adapter-pg` + `pg.Pool`. SSL is conditional (see §3). Use the dev hot-reload guard shown in §2 to avoid exhausting the connection pool.
- `lib/blog.ts` — all blog data-access logic:
  - `getBlogsPage()` — paginated + searchable blog list (search hits `title`/`content` at the DB level).
  - `getBlogBySlug()` — single blog + resolved cover image + resolved categories.
  - `getRecentPosts()` — last N posts w/ thumbnails, for the sidebar.
  - `getCategoriesWithCounts()` — category list with post counts.
  - `getMediaUrl()` — builds the cover image URL as `{NEXT_PUBLIC_MEDIA_BASE_URL}/uploads/blog/{media.id}/{media.file_name}` (uses the **media row's own id**, not the blog's id).
  - `parseCategoryIds()` — parses the legacy JSON-array-of-ids `category` column.
  - `excerptFromContent()` — exported (used both for card excerpts and as a metadata description fallback — see gotcha in §3).
- `lib/format-date.ts` — date-only formatting helper.
- `app/blogs/page.tsx` — listing page: hero heading, 2-column card grid (60/40 main/sidebar split on desktop), pagination, search.
- `app/blogs/[slug]/page.tsx` — details page: cover image, category badges, rendered HTML content, sidebar (no search box), CTA block at the bottom.
- `app/blogs/_components/`:
  - `BlogCard.tsx` — equal-height cards (image, 2-line title, 3-line excerpt, "Read more").
  - `BlogSidebar.tsx` — search box, recent posts (max 6), category badges with counts.
  - `Pagination.tsx` — condensed page range (`1 … 5 6 [7] 8 9 … 53`), not a full list of every page — see gotcha in §3. Plain `<Link>`-based, no client JS.
  - `MobileFilterDrawer.tsx` — client component; collapses the sidebar into an overlay on tablet/mobile, triggered by a "Filters" button.
  - `BlogCTA.tsx` — the "Create GST-compliant invoices for free" promo block, shown at the bottom of every blog details page, linking to `/register`. Copy/link are overridable via props if a specific post ever needs different wording.
- `globals-additions.css` — styles for the rendered blog HTML body (`.blog-content`), written by hand instead of pulling in `@tailwindcss/typography` as a new dependency.

### Notable decisions / assumptions (verify these)
1. **Cover image path**: built as `/uploads/blog/{media.id}/{file_name}`, optionally prefixed by `NEXT_PUBLIC_MEDIA_BASE_URL` if media is served from a CDN rather than this app's own `/public`. Confirm this matches how files are actually served.
2. **Category filtering/counts are computed in application code**, not SQL — because `category` is a JSON-array-text column, not a real relation. Fine at normal blog volumes. If the blog grows very large (tens of thousands of posts), consider migrating to a real `blog_category_pivot` join table for performant filtered queries.
3. **`blog.content` is rendered via `dangerouslySetInnerHTML`**, assuming it's stored as HTML from the legacy CMS. If it's actually Markdown or something else, the details page needs a render step first.
4. `generatePageMetadata()` (used in both pages) and the general metadata/SEO conventions were assumed to match the existing `lib/metadata.ts` helper already in the codebase — double check the import path and signature line up. Note it expects `description` to always be a real string (see gotcha #4 in §3).

---

## 2. Commands to run

```bash
# 1. Install dependencies used by the new code
npm install pg @prisma/adapter-pg
npm install -D csv-parse          # only needed for the one-time CSV import

# 2. Apply the new tables to the database (no migrate dev available in this environment)
npx prisma db push
npx prisma generate

# 3. One-time legacy data import from CSV exports
#    Put blog_categories.csv, blogs.csv, media.csv in ./legacy-csv (or wherever
#    CSV_DIR points), then run with --env-file so DATABASE_URL is actually loaded
#    (plain `tsx` does NOT read .env automatically — see gotcha #5):
npx tsx --env-file=.env scripts/import-from-csv.ts

# afterwards, safe to remove:
npm uninstall csv-parse
# and delete scripts/import-from-csv.ts + the legacy-csv/ folder
```

### Env vars required

```bash
# Postgres database — already existing in the project
DATABASE_URL=postgres://...
DATABASE_SSL=true            # only set this if the target Postgres actually requires SSL (see gotcha #2)

# Optional
NEXT_PUBLIC_MEDIA_BASE_URL=  # only if media isn't served from this app's own /public
```

### `lib/prisma.ts` reference implementation

```ts
import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});
const adapter = new PrismaPg(pool);

// Prevent Next.js dev hot-reload from creating a new pool on every save.
const globalForPrisma = global as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

---

## 3. Gotchas hit during development (already fixed, documented for context)

1. **`Module not found: Can't resolve './generated/prisma'`**
   The newer Prisma TS generator doesn't emit a barrel `index.ts`. Import from the actual client file: `from "./generated/prisma/client"`, not the folder.

2. **`Error opening a TLS connection: The server does not support SSL connections`**
   The `pg.Pool` was hardcoded to always use SSL. Made conditional (see `lib/prisma.ts` above). Only set `DATABASE_SSL=true` for environments that actually require it. This was also the root cause of a confusing `<html>`-nested-in-`<body>` hydration error — that was just Next's dev error overlay reacting to the underlying Prisma/TLS crash, not a real layout bug.

3. **`new PrismaClient()` — "Expected 1 argument, but got 0"**
   The generator's client type makes the options argument required even though every field in it is optional. Pass an object explicitly: `new PrismaClient({ adapter })`.

4. **Details page crash: `Cannot read properties of undefined (reading 'slice')` in `generatePageMetadata`**
   That helper calls `description.slice(...)` assuming `description` is always a string. Many blogs have a blank `meta_decription` (confirmed from real CSV data), and the page was passing `undefined` in that case. Fixed by always passing a real string with a fallback chain: `meta_decription → excerptFromContent(content) → title`.

5. **Pagination UI overflowing the page (rendering all 53 page numbers in a row)**
   `Pagination.tsx` originally rendered a `<Link>` for every page. Replaced with a condensed range (`1 … 5 6 [7] 8 9 … 53`) plus `flex-wrap` as a safety net.

6. **`SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string`**
   Misleading error — not a real auth failure. `DATABASE_URL` was `undefined` because plain `npx tsx scripts/whatever.ts` does **not** auto-load `.env` (only Next's own dev/build process does that). Fix: `npx tsx --env-file=.env scripts/whatever.ts`, or `import "dotenv/config"` as the first line of the script.

---

## 4. Open items / not yet done

- [ ] `robots.ts` / `sitemap.ts` entries for `/blogs` and `/blogs/{slug}` — offered, not yet built.
- [ ] Confirm cover image serving path/CDN setup.
- [ ] Confirm `blog.content` is HTML (not Markdown) before shipping the details page as-is.
- [ ] Run the CSV import against production data and verify row counts match the source exports.
