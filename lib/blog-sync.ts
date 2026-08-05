import path from "node:path";
import { prisma } from "@/lib/prisma";
import { saveMediaFile } from "@/lib/media-storage";

const API_URL = process.env.BLOG_SYNC_API_URL!;
const BASE_IMAGE_URL = process.env.BLOG_SYNC_BASE_IMAGE_URL!;
const TENANT_ID = process.env.BLOG_SYNC_TENANT_ID || "default";
const DEFAULT_USER_ID = Number(process.env.BLOG_SYNC_DEFAULT_USER_ID || 1);

const MEDIA_MODEL_TYPE = "Blog";
const MEDIA_COLLECTION = "blog";

export type SyncStats = { new: number; skipped: number; errors: number };

type RemoteImage = {
  url: string;
  id?: string;
  alt?: string;
  caption?: string;
};

type RemotePost = {
  slug: string;
  title: string;
  content: string;
  category?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  tags?: string[];
  images?: RemoteImage[];
  featuredImage?: RemoteImage;
};

/** Main entry point — mirrors BlogSyncService::sync(). */
export async function syncBlogs(): Promise<SyncStats> {
  const stats: SyncStats = { new: 0, skipped: 0, errors: 0 };

  const posts = await fetchPosts();
  if (posts.length === 0) {
    console.warn("blog-sync: no posts returned from API");
    return stats;
  }

  for (const post of posts) {
    try {
      const result = await syncPost(post);
      stats[result]++;
    } catch (err) {
      stats.errors++;
      console.error("blog-sync: failed to sync post", post?.slug, err);
    }
  }

  console.log("blog-sync: complete", stats);
  return stats;
}

// ── API ─────────────────────────────────────────────────────────────────

/** Fetches the post list, with a 30s timeout and up to 3 attempts (mirrors ->retry(3, 1000)). */
async function fetchPosts(): Promise<RemotePost[]> {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);
      const res = await fetch(API_URL, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`API request failed: ${res.status}`);
      const json = await res.json();
      return json.posts ?? [];
    } catch (err) {
      if (attempt === maxAttempts) {
        console.error("blog-sync: API request failed after retries", err);
        return [];
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return [];
}

// ── Sync a single post ─────────────────────────────────────────────────

/**
 * Dedup key: slug. Insert-only — if a blog with this slug already exists,
 * it's left untouched (never overwritten), even if the source content has
 * since changed. This protects any manual edits made after the initial
 * sync. Only genuinely new slugs get created.
 */
async function syncPost(post: RemotePost): Promise<"new" | "skipped"> {
  if (!post.slug) throw new Error("Post missing slug.");

  const existing = await prisma.blog.findUnique({ where: { slug: post.slug } });
  if (existing) {
    return "skipped";
  }

  const categoryId = await resolveCategoryId(post.category ?? null);

  const blog = await prisma.blog.create({
    data: {
      slug: post.slug,
      title: post.title,
      content: post.content,
      category: categoryId ? JSON.stringify([categoryId]) : null,
      old_category: categoryId ?? 0,
      meta_title: post.metaTitle ?? null,
      meta_decription: post.metaDescription ?? null,
      meta_key: post.tags?.length ? post.tags.join(",") : null,
      tenant_id: TENANT_ID,
      user: DEFAULT_USER_ID,
    },
  });

  // Merge featuredImage into the images array, same as the PHP version.
  const images = [...(post.images ?? [])];
  if (post.featuredImage) images.push(post.featuredImage);

  await syncMedia(images, blog.id);

  return "new";
}

// ── Category ────────────────────────────────────────────────────────────

/** find-or-create by slug, mirrors BlogCategory::firstOrCreate(). */
async function resolveCategoryId(categoryName: string | null): Promise<number | null> {
  if (!categoryName) return null;

  const slug = slugify(categoryName);

  const existing = await prisma.blogCategory.findUnique({ where: { slug } });
  if (existing) return existing.id;

  const created = await prisma.blogCategory.create({
    data: { name: categoryName, slug, tenant_id: TENANT_ID },
  });
  return created.id;
}

// ── Media ───────────────────────────────────────────────────────────────

/**
 * Downloads each remote image and writes a `media` row + the file itself,
 * mirroring the PHP version's addMediaFromUrl()->toMediaCollection() flow.
 * Dedup key: custom_properties.remote_uuid (same field, but read via JS
 * JSON.parse rather than a JSON-path DB query, since custom_properties is
 * stored as raw text to match the legacy column type).
 */
async function syncMedia(images: RemoteImage[], blogId: number): Promise<void> {
  const existingMedia = await prisma.media.findMany({
    where: {
      model_type: MEDIA_MODEL_TYPE,
      model_id: BigInt(blogId),
      collection_name: MEDIA_COLLECTION,
    },
  });

  const importedUuids = new Set(
    existingMedia
      .map((m) => safeJsonParse(m.custom_properties)?.remote_uuid)
      .filter(Boolean),
  );

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    if (!image?.url) continue;
    if (image.id && importedUuids.has(image.id)) continue; // already imported

    const resolvedUrl = resolveImageUrl(image.url);

    try {
      const res = await fetch(resolvedUrl);
      if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);

      const buffer = Buffer.from(await res.arrayBuffer());
      const mimeType = res.headers.get("content-type") ?? undefined;
      const fileName = path.basename(new URL(resolvedUrl).pathname);

      const customProperties = JSON.stringify({
        alt: image.alt ?? "",
        caption: image.caption ?? "",
        remote_uuid: image.id ?? null,
        remote_url: resolvedUrl,
      });

      // Insert the row first (need its id for the folder path), then write
      // the file — same order Spatie Media Library uses internally.
      const media = await prisma.media.create({
        data: {
          model_type: MEDIA_MODEL_TYPE,
          model_id: BigInt(blogId),
          collection_name: MEDIA_COLLECTION,
          name: fileName,
          file_name: fileName,
          mime_type: mimeType,
          disk: "public",
          size: BigInt(buffer.length),
          custom_properties: customProperties,
          order_column: i + 1,
        },
      });

      await saveMediaFile(buffer, media.id, fileName);
    } catch (err) {
      console.error("blog-sync: failed to import media", { blogId, url: resolvedUrl, err });
      // continue with the remaining images, same as the PHP version
    }
  }
}

// ── Helpers ────────────────────────────────────────────────────────────

function resolveImageUrl(url: string): string {
  return url.startsWith("http") ? url : `${BASE_IMAGE_URL}${url}`;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function safeJsonParse(text: string | null): { remote_uuid?: string } | null {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
