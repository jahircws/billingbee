/**
 * Import blog_categories, blogs, and media from exported CSV files into the
 * new Postgres database — no live connection to the legacy MySQL DB needed.
 *
 * Expects CSV files with a header row whose column names/order match the
 * legacy schema exactly (same as blog_categories.csv you already have).
 * Place them in a folder and point CSV_DIR at it.
 *
 * SAFE TO RE-RUN: rows are upserted by their original `id`
 * (INSERT ... ON CONFLICT (id) DO UPDATE), preserving the original primary
 * keys — no id remapping needed since the schema mirrors the legacy tables.
 *
 * Setup:
 *   npm install csv-parse
 *
 * Run:
 *   CSV_DIR=./legacy-csv npx tsx scripts/import-from-csv.ts
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";

import { prisma } from "@/lib/prisma";
const CSV_DIR = "./legacy-csv";

/** Empty CSV cell -> null, everything else passed through as-is. */
function n(v: string | undefined): string | null {
  return v === undefined || v === "" ? null : v;
}

async function loadCsv(fileName: string): Promise<Record<string, string>[]> {
  const filePath = path.join(CSV_DIR, fileName);
  const raw = await readFile(filePath, "utf-8");
  return parse(raw, { columns: true, skip_empty_lines: true, trim: true });
}

async function resyncSequence(table: string) {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1))`,
  );
}

async function main() {
  // ── 1. blog_categories.csv ──────────────────────────────────────────
  const categories = await loadCsv("blog_categories.csv");
  for (const row of categories) {
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
      Number(row.id),
      row.name,
      n(row.description),
      row.slug,
      n(row.meta_title),
      n(row.meta_description),
      n(row.meta_key),
      n(row.tenant_id),
      n(row.created_at),
      n(row.updated_at),
    );
  }
  await resyncSequence("blog_categories");
  console.log(`Imported ${categories.length} categories.`);

  // ── 2. blogs.csv ─────────────────────────────────────────────────────
  let blogsImported = 0;
  try {
    const blogs = await loadCsv("blogs.csv");
    for (const row of blogs) {
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
        Number(row.id),
        row.old_category ? Number(row.old_category) : null,
        n(row.category), // JSON-array-of-ids text, copied as-is
        row.user ? Number(row.user) : null,
        row.title,
        row.slug,
        row.content,
        n(row.meta_title),
        n(row.meta_decription),
        n(row.meta_key),
        n(row.tenant_id),
        n(row.created_at),
        n(row.updated_at),
      );
      blogsImported++;
    }
    await resyncSequence("blogs");
  } catch (err) {
    console.log("blogs.csv not found or failed to parse — skipping.", err);
  }
  console.log(`Imported ${blogsImported} blogs.`);

  // ── 3. media.csv ─────────────────────────────────────────────────────
  let mediaImported = 0;
  try {
    const media = await loadCsv("media.csv");
    for (const row of media) {
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
        Number(row.id),
        row.model_type,
        Number(row.model_id),
        n(row.uuid),
        row.collection_name,
        row.name,
        row.file_name,
        n(row.mime_type),
        row.disk,
        n(row.conversions_disk),
        Number(row.size),
        row.manipulations ?? "[]",
        row.custom_properties ?? "[]",
        row.generated_conversions ?? "[]",
        row.responsive_images ?? "[]",
        row.order_column ? Number(row.order_column) : null,
        n(row.created_at),
        n(row.updated_at),
      );
      mediaImported++;
    }
    await resyncSequence("media");
  } catch (err) {
    console.log("media.csv not found or failed to parse — skipping.", err);
  }
  console.log(`Imported ${mediaImported} media rows.`);

  await prisma.$disconnect();
  console.log("Done.");
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});