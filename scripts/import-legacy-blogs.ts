/**
 * Import legacy blog_categories, blogs, and blog media from the old MySQL
 * database into the new Postgres/Prisma database.
 *
 * Because the new tables mirror the legacy column names and types exactly,
 * this is a straight row-for-row copy that PRESERVES the original primary
 * keys — no id remapping anywhere, including the `category` JSON array on
 * blogs (those ids still point at the same BlogCategory rows) and `model_id`
 * on media (still points at the same Blog row).
 *
 * SAFE TO RE-RUN: every row is upserted by its original `id`
 * (INSERT ... ON CONFLICT (id) DO UPDATE), so re-running this will update
 * existing rows in place rather than duplicating them.
 *
 * Setup:
 *   npm install mysql2
 *
 * Env vars (add to .env, do NOT commit real values):
 *   LEGACY_DB_HOST=
 *   LEGACY_DB_PORT=3306
 *   LEGACY_DB_USER=
 *   LEGACY_DB_PASSWORD=
 *   LEGACY_DB_NAME=
 *   LEGACY_BLOG_MODEL_TYPE=App\\Models\\Blog   // model_type value used in the
 *                                              // old `media` table for blog rows
 *
 * Run:
 *   npx tsx scripts/import-legacy-blogs.ts
 *   (or: npx ts-node scripts/import-legacy-blogs.ts)
 */

import mysql from "mysql2/promise";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LEGACY_BLOG_MODEL_TYPE =
  process.env.LEGACY_BLOG_MODEL_TYPE || "App\\Models\\Blog";

interface LegacyCategoryRow {
  id: number;
  name: string;
  description: string | null;
  slug: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_key: string | null;
  tenant_id: number | null;
  created_at: Date | null;
  updated_at: Date | null;
}

interface LegacyBlogRow {
  id: number;
  old_category: number | null;
  category: string | null; // JSON-encoded array of category ids
  user: number | null;
  title: string;
  slug: string;
  content: string;
  meta_title: string | null;
  meta_decription: string | null;
  meta_key: string | null;
  tenant_id: number | null;
  created_at: Date | null;
  updated_at: Date | null;
}

interface LegacyMediaRow {
  id: number;
  model_type: string;
  model_id: number;
  uuid: string | null;
  collection_name: string;
  name: string;
  file_name: string;
  mime_type: string | null;
  disk: string;
  conversions_disk: string | null;
  size: number;
  manipulations: string | null;
  custom_properties: string | null;
  generated_conversions: string | null;
  responsive_images: string | null;
  order_column: number | null;
  created_at: Date | null;
  updated_at: Date | null;
}

/** Resync a Postgres autoincrement sequence after explicit-id inserts. */
async function resyncSequence(table: string) {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1))`,
  );
}

async function main() {
  const legacyDb = await mysql.createConnection({
    host: process.env.LEGACY_DB_HOST,
    port: Number(process.env.LEGACY_DB_PORT || 3306),
    user: process.env.LEGACY_DB_USER,
    password: process.env.LEGACY_DB_PASSWORD,
    database: process.env.LEGACY_DB_NAME,
  });

  console.log("Connected to legacy MySQL database.");

  // ── 1. blog_categories ──────────────────────────────────────────────
  const [categoryRows] = await legacyDb.query<mysql.RowDataPacket[]>(
    "SELECT * FROM blog_categories",
  );
  const legacyCategories = categoryRows as unknown as LegacyCategoryRow[];

  for (const row of legacyCategories) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO blog_categories
         (id, name, description, slug, meta_title, meta_description, meta_key, tenant_id, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         slug = EXCLUDED.slug,
         meta_title = EXCLUDED.meta_title,
         meta_description = EXCLUDED.meta_description,
         meta_key = EXCLUDED.meta_key,
         tenant_id = EXCLUDED.tenant_id,
         updated_at = EXCLUDED.updated_at`,
      row.id,
      row.name,
      row.description,
      row.slug,
      row.meta_title,
      row.meta_description,
      row.meta_key,
      row.tenant_id,
      row.created_at,
      row.updated_at,
    );
  }
  await resyncSequence("blog_categories");
  console.log(`Imported ${legacyCategories.length} categories.`);

  // ── 2. blogs ──────────────────────────────────────────────────────────
  const [blogRows] = await legacyDb.query<mysql.RowDataPacket[]>(
    "SELECT * FROM blogs",
  );
  const legacyBlogs = blogRows as unknown as LegacyBlogRow[];

  for (const row of legacyBlogs) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO blogs
         (id, old_category, category, "user", title, slug, content, meta_title, meta_decription, meta_key, tenant_id, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (id) DO UPDATE SET
         old_category = EXCLUDED.old_category,
         category = EXCLUDED.category,
         "user" = EXCLUDED."user",
         title = EXCLUDED.title,
         slug = EXCLUDED.slug,
         content = EXCLUDED.content,
         meta_title = EXCLUDED.meta_title,
         meta_decription = EXCLUDED.meta_decription,
         meta_key = EXCLUDED.meta_key,
         tenant_id = EXCLUDED.tenant_id,
         updated_at = EXCLUDED.updated_at`,
      row.id,
      row.old_category,
      row.category, // copied as-is: same category ids, same referenced rows
      row.user,
      row.title,
      row.slug,
      row.content,
      row.meta_title,
      row.meta_decription,
      row.meta_key,
      row.tenant_id,
      row.created_at,
      row.updated_at,
    );
  }
  await resyncSequence("blogs");
  console.log(`Imported ${legacyBlogs.length} blogs.`);

  // ── 3. media (blog cover images etc.) ────────────────────────────────
  const legacyBlogIds = legacyBlogs.map((b) => b.id);
  let mediaImported = 0;

  if (legacyBlogIds.length > 0) {
    const [mediaRows] = await legacyDb.query<mysql.RowDataPacket[]>(
      `SELECT * FROM media WHERE model_type = ? AND model_id IN (?)`,
      [LEGACY_BLOG_MODEL_TYPE, legacyBlogIds],
    );
    const legacyMedia = mediaRows as unknown as LegacyMediaRow[];

    for (const row of legacyMedia) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO media
           (id, model_type, model_id, uuid, collection_name, name, file_name,
            mime_type, disk, conversions_disk, size, manipulations,
            custom_properties, generated_conversions, responsive_images,
            order_column, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
         ON CONFLICT (id) DO UPDATE SET
           model_type = EXCLUDED.model_type,
           model_id = EXCLUDED.model_id,
           uuid = EXCLUDED.uuid,
           collection_name = EXCLUDED.collection_name,
           name = EXCLUDED.name,
           file_name = EXCLUDED.file_name,
           mime_type = EXCLUDED.mime_type,
           disk = EXCLUDED.disk,
           conversions_disk = EXCLUDED.conversions_disk,
           size = EXCLUDED.size,
           manipulations = EXCLUDED.manipulations,
           custom_properties = EXCLUDED.custom_properties,
           generated_conversions = EXCLUDED.generated_conversions,
           responsive_images = EXCLUDED.responsive_images,
           order_column = EXCLUDED.order_column,
           updated_at = EXCLUDED.updated_at`,
        row.id,
        row.model_type, // kept exactly as legacy, e.g. "App\Models\Blog"
        row.model_id,   // unchanged: still the same blog id
        row.uuid,
        row.collection_name,
        row.name,
        row.file_name,
        row.mime_type,
        row.disk,
        row.conversions_disk,
        row.size,
        row.manipulations ?? "[]",
        row.custom_properties ?? "[]",
        row.generated_conversions ?? "[]",
        row.responsive_images ?? "[]",
        row.order_column,
        row.created_at,
        row.updated_at,
      );
      mediaImported++;
    }
    await resyncSequence("media");
  }

  console.log(`Imported ${mediaImported} media rows.`);

  await legacyDb.end();
  await prisma.$disconnect();
  console.log("Done.");
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
