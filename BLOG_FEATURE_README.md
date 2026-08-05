# Blog Feature — Handoff Notes

Everything built for BillingBee's blog feature: public pages (`/blogs`, `/blogs/{slug}`), the legacy CSV import, the automated blog-sync service, and the admin CRUD panel. For whoever picks this up next.

---

## 1. What's been done

### Database / Prisma
- Added three models to `schema.prisma`: `BlogCategory`, `Blog`, `Media`.
- **Table and column names intentionally match the legacy MySQL schema exactly** — same table names (`blog_categories`, `blogs`, `media`), same column names, including the legacy `meta_decription` typo (confirmed correct — do not "fix" this spelling) and the `category` column (kept as a raw JSON-array-of-ids text field, *not* a relational pivot table).
- `tenant_id` is `String?` (UUID), not `Int?` — the legacy data uses UUIDs (e.g. `9ebfa566-7623-4a41-81e3-107abbb7d291`), confirmed from the real `blog_categories.csv` export.
- `Media` mirrors the existing Spatie-style polymorphic media table (`model_type` / `model_id` / `collection_name`). If a `Media` model already existed in the project, the new one should be skipped/merged rather than duplicated.
- **Confirmed relationship**: a blog's cover image is the `media` row where `model_id = blogs.id`, `model_type = 'Blog'`, and `collection_name = 'blog'`. All queries filter on all three.
- Schema was applied with `npx prisma db push` (not `migrate dev`, per environment restrictions — no migration history files were generated as a result; be aware of drift if this project later adopts tracked migrations).

### Legacy data import — CSV-based (one-off, already run)
- Script: `scripts/import-from-csv.ts`. Reads `blog_categories.csv` / `blogs.csv` / `media.csv` from a folder (`CSV_DIR` env var) using `csv-parse/sync`, and upserts into Postgres via raw SQL (`INSERT ... ON CONFLICT (id) DO UPDATE`), preserving original primary keys (no id remapping needed, since the schema is identical to the source).
- Safe to re-run — upserts by original `id`.
- **Not needed at runtime.** Once run successfully in production, `csv-parse` can be uninstalled and the script + CSV folder deleted.
- *(An earlier MySQL-live-connection version of this script, using `mysql2`, was replaced by the CSV approach — `mysql2` is not a dependency.)*

### Public pages — application code
- `lib/prisma.ts` — Prisma client singleton, `@prisma/adapter-pg` + `pg.Pool`. SSL is conditional (see §4). Dev hot-reload guard included.
- `lib/blog.ts` — read-only data-access layer for the public pages:
  - `getBlogsPage()` — paginated + searchable list (title/content search at the DB level; category filter done in app code — see §3 assumption #2).
  - `getBlogBySlug()`, `getRecentPosts()`, `getCategoriesWithCounts()`.
  - `getMediaUrl(media)` — `{NEXT_PUBLIC_MEDIA_BASE_URL}/uploads/blog/{media.id}/{media.file_name}` — uses the **media row's own id**, not the blog's id.
  - `parseCategoryIds()`, `excerptFromContent()` — both exported for reuse elsewhere (the sync service and admin panel use them too).
- `lib/format-date.ts`, `lib/slugify.ts` — small shared helpers.
- `app/blogs/page.tsx` / `app/blogs/[slug]/page.tsx` — listing + details, 60/40 main/sidebar split, pagination, search, mobile filter drawer, `BlogCTA` block, back-to-list link.
- `app/blogs/_components/` — `BlogCard`, `BlogSidebar`, `Pagination` (condensed range, not a full list), `MobileFilterDrawer`, `BlogCTA`.
- `globals-additions.css` — hand-written `.blog-content` styles for the rendered HTML body (no `@tailwindcss/typography` dependency).

### Automated blog sync — port of `BlogSyncService.php`
- `lib/blog-sync.ts` — fetches posts from the external content API, and for each one:
  - Dedupes by `slug`. **Insert-only**: if a blog with that slug already exists, it's skipped entirely — never updated. This protects any manual edits made after the initial sync (see note in §3).
  - Resolves/creates the category by slug (`resolveCategoryId`).
  - Downloads each image (including `featuredImage`), dedupes per-image via `custom_properties.remote_uuid` (parsed from the stored JSON text, not a DB-level JSON query, since `custom_properties` is a plain text column), and writes both the `media` row and the file itself.
- `lib/media-storage.ts` — isolated file-write helper (`public/uploads/blog/{media.id}/{file_name}`). **Only works on a persistent filesystem** (this is fine — this app runs via `next start` on a VPS/EC2, not serverless). If it ever moves to Vercel/serverless, this is the one function to swap for an object-storage upload.
- `app/api/blog-sync/route.ts` — `POST` endpoint, bearer-token protected (`Authorization: Bearer $BLOG_SYNC_SECRET`), meant to be triggered by an external cron (this project's cron runs on AWS/EC2, not Vercel Cron).
- `scripts/run-blog-sync.ts` — standalone local test runner, calls `syncBlogs()` directly (no server, no auth header). Safe to re-run — idempotent by design.

### Admin CRUD panel
- `AdminSidebar.tsx` — added "Blog Posts" and "Blog Categories" nav entries.
- **Categories** — `app/admin/blog-categories/`: list (`page.tsx`), `new/page.tsx`, `[id]/edit/page.tsx`, shared `_components/CategoryForm.tsx`, `_actions.ts` (`createCategory`, `updateCategory`, `deleteCategory`).
- **Blog posts** — `app/admin/blogs/`: list, `new/page.tsx`, `[id]/edit/page.tsx`, shared `_components/BlogForm.tsx`, `_actions.ts` (`createBlog`, `updateBlog`, `deleteBlog`).
  - `old_category` is hardcoded to `1` on create (per spec — not derived from the selected category), left untouched on edit.
  - `category` is saved as `JSON.stringify([...selectedCategoryIds])` via checkboxes in the form, matching the existing column convention.
  - **Cover image upload**: accepts any image, resizes/crops to exactly **1080×630** via `sharp` (`fit: 'cover'`, centered), converts to WebP, stored through the same `media`/`saveMediaFile` conventions the public pages read from — no changes needed on the public side when a post is created/edited here. Replacing a cover deletes the old file + row first.
  - Deleting a blog also cleans up its `media` rows and files.
- `app/admin/_components/DeleteButton.tsx` — shared client component used by both list pages. `window.confirm()` prompt before calling the delete server action, spinner (`useTransition`) while pending, button disabled during the request.

### ⚠️ Not done — needs input before shipping
- **No auth check in any admin server action.** `blog-categories/_actions.ts` and `blogs/_actions.ts` both have a `TODO` comment at the top. Anyone who can reach these mutations can currently create/edit/delete blog content with no session check. Needs the project's actual admin-session helper wired in before this goes live.

---

## 2. Commands to run

```bash
# 1. Dependencies
npm install pg @prisma/adapter-pg
npm install sharp                     # admin cover-image resize/crop
npm install -D csv-parse              # only needed for the one-time CSV import

# 2. Apply schema (no migrate dev available in this environment)
npx prisma db push
npx prisma generate

# 3. One-time legacy data import (skip if already run)
npx tsx --env-file=.env scripts/import-from-csv.ts
npm uninstall csv-parse   # afterwards, safe to remove

# 4. Local test of the blog sync (safe/idempotent to re-run)
npx tsx --env-file=.env scripts/run-blog-sync.ts

# 5. Production trigger (via AWS cron, hitting the API route)
# 0 * * * * curl -s -X POST https://your-domain.com/api/blog-sync \
#   -H "Authorization: Bearer $BLOG_SYNC_SECRET"
```

### Env vars required

```bash
# Postgres — already existing in the project
DATABASE_URL=postgres://...
DATABASE_SSL=true                     # only if the target Postgres actually requires SSL — see gotcha #2

# Optional
NEXT_PUBLIC_MEDIA_BASE_URL=           # only if media isn't served from this app's own /public

# Blog sync
BLOG_SYNC_API_URL=https://blogagent.cwsdev1.com/api/widget/3882a144-2ece-4847-85fc-e6fdeb826efd/posts
BLOG_SYNC_BASE_IMAGE_URL=https://blogagent.cwsdev1.com
BLOG_SYNC_TENANT_ID=                  # must match a real tenant_id UUID
BLOG_SYNC_DEFAULT_USER_ID=1
BLOG_SYNC_SECRET=                     # random string; required in the Authorization header
```

### `lib/prisma.ts` reference implementation

```ts
import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
});
const adapter = new PrismaPg(pool);

const globalForPrisma = global as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

**Note:** this project also has a second, separate Prisma client (`lib/db.ts`, used by the admin-auth routes) with its own `pg.Pool`. Two pools hitting the same database is wasteful and was the source of a repeat SSL bug (see gotcha #7) — worth consolidating into one client if there's no real reason to keep them apart.

---

## 3. Notable decisions / assumptions (worth double-checking)

1. **Cover image path**: `/uploads/blog/{media.id}/{file_name}`, optionally prefixed by `NEXT_PUBLIC_MEDIA_BASE_URL`. Confirmed the `model_id`/`collection_name='blog'` relationship; the path format itself is still an assumption about how files are served in production.
2. **Category filtering/counts computed in app code**, not SQL — `category` is a JSON-array-text column, not a real relation. Fine at normal volumes; revisit with a real join table if this ever reaches tens of thousands of posts.
3. **`blog.content` rendered via `dangerouslySetInnerHTML`** — assumes HTML, not Markdown. The admin `BlogForm` content field is a raw-HTML textarea for the same reason; swap for a WYSIWYG later if needed, it only touches that one component.
4. **Sync is insert-only by design** (§1) — a real tradeoff, not an oversight: it can never clobber a manual edit, but it also won't pick up upstream corrections to already-synced posts.
5. `generatePageMetadata()` signature/import path assumed to match the existing `lib/metadata.ts` helper — and it expects `description` to always be a real string (see gotcha #4).

---

## 4. Gotchas hit during development (already fixed, documented for context)

1. **`Module not found: Can't resolve './generated/prisma'`** — the Prisma TS generator doesn't emit a barrel `index.ts`. Import from `./generated/prisma/client`, not the folder.

2. **`Error opening a TLS connection: The server does not support SSL connections`** — `pg.Pool` was hardcoded to always use SSL. Fixed by making it conditional on `DATABASE_SSL === "true"`.

3. **`new PrismaClient()` — "Expected 1 argument, but got 0"** — the generator's client type requires the options argument even though every field in it is optional. Pass one explicitly: `new PrismaClient({ adapter })`.

4. **Details page crash: `Cannot read properties of undefined (reading 'slice')` in `generatePageMetadata`** — it calls `description.slice(...)` assuming a string. Many blogs have a blank `meta_decription`. Fixed with a fallback chain: `meta_decription → excerptFromContent(content) → title`.

5. **Pagination UI overflowing (rendering all 53 page numbers in a row)** — replaced with a condensed range (`1 … 5 6 [7] 8 9 … 53`) plus `flex-wrap` as a safety net.

6. **`SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string`** — misleading; `DATABASE_URL` was actually `undefined` because plain `npx tsx script.ts` doesn't auto-load `.env`. Fix: `npx tsx --env-file=.env script.ts`.

7. **Same TLS error recurred on `/admin/login`, from a *different* file (`lib/db.ts`)** — this project has two separate Prisma clients, and only one had been fixed. Root cause was subtler than gotcha #2: `lib/db.ts` used `NODE_ENV !== "production"` to decide whether to force SSL, which conflates "which environment am I in" with "does the specific database I'm pointed at need SSL" — those aren't the same thing (local dev can point at either a local DB with no SSL, or a remote one that requires it). Fixed by keying off an explicit `DATABASE_SSL` env var instead, consistent with `lib/prisma.ts`.

8. **Fix from #7 initially didn't take even after the edit** — because `ssl: undefined` in `pg` doesn't mean "off," it means "defer to whatever the connection string itself says" (e.g. a stray `sslmode=require` in `DATABASE_URL`). Had to use an explicit `ssl: false`, not `undefined`, to actually force it off for local dev.

9. **`Module not found: Can't resolve 'dns'` in `BlogForm.tsx`** — that component is `"use client"`, but it imported `parseCategoryIds` from `lib/blog.ts`, which imports `lib/prisma.ts`, which imports `pg` — a Node-only package that needs `dns`, breaking the browser bundle. Fixed by giving `BlogForm.tsx` its own local, dependency-free copy of that one small function instead of importing the server-only module.

---

## 5. Open items / not yet done

- [ ] **Wire up real admin-session auth in the CRUD server actions** — currently the biggest gap, see §1.
- [ ] `robots.ts` / `sitemap.ts` entries for `/blogs` and `/blogs/{slug}`.
- [ ] Confirm cover image serving path/CDN setup in production.
- [ ] Confirm `blog.content` is genuinely HTML (not Markdown).
- [ ] Consider consolidating `lib/prisma.ts` and `lib/db.ts` into one client (see §2 note).
- [ ] Consider a real WYSIWYG editor for the admin content field, if raw HTML editing proves painful for whoever writes posts.
