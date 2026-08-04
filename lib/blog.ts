import { prisma } from "@/lib/prisma";

/**
 * model_type value written into the `media` table for blog cover images.
 */
export const BLOG_MEDIA_MODEL_TYPE = "App\Models\Blog";

/**
 * collection_name value that marks a media row as a blog's cover image.
 */
export const BLOG_MEDIA_COLLECTION_NAME = "blog";

/**
 * Optional CDN/base URL prefix if media isn't served from this app's own
 * public dir. Leave NEXT_PUBLIC_MEDIA_BASE_URL unset to serve from "/uploads".
 */
const MEDIA_BASE_URL = process.env.NEXT_PUBLIC_MEDIA_BASE_URL || "";

export function getMediaUrl(media: { id: number; file_name: string }): string {
  return `/uploads/blog/${media.id}/${media.file_name}`;
}

/** Parses the legacy JSON-array-of-ids `category` column on `blogs`. */
export function parseCategoryIds(category: string | null): number[] {
  if (!category) return [];
  try {
    const parsed = JSON.parse(category);
    return Array.isArray(parsed)
      ? parsed.map(Number).filter((n) => !Number.isNaN(n))
      : [];
  } catch {
    return [];
  }
}

export function excerptFromContent(content: string, length = 160): string {
  const text = content
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > length ? text.slice(0, length).trimEnd() + "…" : text;
}

export type BlogCardData = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  created_at: Date;
  coverUrl: string | null;
};

type BlogRow = {
  id: number;
  title: string;
  slug: string;
  content: string;
  category: string | null;
  created_at: Date;
};

function toCardData(blog: BlogRow, coverMap: Map<number, string>): BlogCardData {
  return {
    id: blog.id,
    title: blog.title,
    slug: blog.slug,
    excerpt: excerptFromContent(blog.content),
    created_at: blog.created_at,
    coverUrl: coverMap.get(blog.id) ?? null,
  };
}

/**
 * Batch-fetches the first media row (by order_column) for each blog id and
 * returns a map of blogId -> public URL. `media` has no real Prisma relation
 * to `blogs` (it's polymorphic via model_type/model_id), so this is a
 * separate query rather than an `include`.
 */
async function attachCoverImages(
  blogs: { id: number }[],
): Promise<Map<number, string>> {
  if (blogs.length === 0) return new Map();

  const media = await prisma.media.findMany({
    where: {
      // model_type: BLOG_MEDIA_MODEL_TYPE,
      collection_name: BLOG_MEDIA_COLLECTION_NAME,
      model_id: { in: blogs.map((b) => BigInt(b.id)) },
    },
    orderBy: { order_column: "asc" },
  });

  const map = new Map<number, string>();
  for (const m of media) {
    const blogId = Number(m.model_id);
    if (!map.has(blogId)) map.set(blogId, getMediaUrl(m)); // first = cover
  }
  return map;
}

export async function getBlogsPage({
  page = 1,
  perPage = 6,
  q,
  categorySlug,
}: {
  page?: number;
  perPage?: number;
  q?: string;
  categorySlug?: string;
}) {
  const where = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { content: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  // `category` is a JSON-array-of-ids text column (legacy shape), not a
  // real relation, so filtering by category can't happen in the WHERE
  // clause — resolve the slug, then filter/paginate in application code.
  if (categorySlug) {
    const cat = await prisma.blogCategory.findUnique({
      where: { slug: categorySlug },
    });
    if (!cat) {
      return { items: [], total: 0, page, perPage, totalPages: 1 };
    }

    const all = await prisma.blog.findMany({
      where,
      orderBy: { created_at: "desc" },
    });
    const filtered = all.filter((b) =>
      parseCategoryIds(b.category).includes(cat.id),
    );
    const total = filtered.length;
    const pageItems = filtered.slice(
      (page - 1) * perPage,
      (page - 1) * perPage + perPage,
    );
    const coverMap = await attachCoverImages(pageItems);

    return {
      items: pageItems.map((b) => toCardData(b, coverMap)),
      total,
      page,
      perPage,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    };
  }

  const [total, blogs] = await Promise.all([
    prisma.blog.count({ where }),
    prisma.blog.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  const coverMap = await attachCoverImages(blogs);

  return {
    items: blogs.map((b) => toCardData(b, coverMap)),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getBlogBySlug(slug: string) {
  const blog = await prisma.blog.findUnique({ where: { slug } });
  if (!blog) return null;

  const media = await prisma.media.findMany({
    where: {
      // model_type: BLOG_MEDIA_MODEL_TYPE,
      collection_name: BLOG_MEDIA_COLLECTION_NAME,
      model_id: BigInt(blog.id),
    },
    orderBy: { order_column: "asc" },
  });
  const coverUrl = media.length > 0 ? getMediaUrl(media[0]) : null;

  const categoryIds = parseCategoryIds(blog.category);
  const categories = categoryIds.length
    ? await prisma.blogCategory.findMany({ where: { id: { in: categoryIds } } })
    : [];

  return { blog, coverUrl, categories };
}

export async function getRecentPosts(limit = 6) {
  const blogs = await prisma.blog.findMany({
    orderBy: { created_at: "desc" },
    take: limit,
    select: { id: true, title: true, slug: true, created_at: true },
  });
  const coverMap = await attachCoverImages(blogs);
  return blogs.map((b) => ({ ...b, coverUrl: coverMap.get(b.id) ?? null }));
}

export async function getCategoriesWithCounts() {
  const [categories, blogs] = await Promise.all([
    prisma.blogCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.blog.findMany({ select: { category: true } }),
  ]);

  const counts = new Map<number, number>();
  for (const b of blogs) {
    for (const id of parseCategoryIds(b.category)) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }

  return categories.map((c) => ({ ...c, count: counts.get(c.id) ?? 0 }));
}
