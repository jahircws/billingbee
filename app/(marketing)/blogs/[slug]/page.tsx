import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { generatePageMetadata } from "@/lib/metadata";
import { getBlogBySlug, getRecentPosts, getCategoriesWithCounts, excerptFromContent } from "@/lib/blog";
import { formatDateOnly } from "@/lib/format-date";
import { BlogSidebar } from "../_components/BlogSidebar";
import { BlogCTA } from "../_components/BlogCTA";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getBlogBySlug(slug);
  if (!data) return {};

  const description =
    data.blog.meta_decription || excerptFromContent(data.blog.content) || data.blog.title;

  return {
    ...generatePageMetadata(
      data.blog.meta_title || data.blog.title,
      description,
      `/blogs/${slug}`,
    ),
  };
}

export default async function BlogDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getBlogBySlug(slug);
  if (!data) notFound();

  const { blog, coverUrl, categories } = data;
  const [recentPosts, allCategories] = await Promise.all([
    getRecentPosts(6),
    getCategoriesWithCounts(),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="BillingBee" width={140} height={28} className="brightness-0" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Sign in
            </Link>
            <Link
              href="/register"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-95"
            >
              Try free →
            </Link>
          </div>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex flex-col lg:flex-row gap-10">
          <article className="lg:w-[60%]">
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/blogs?category=${cat.slug}`}
                    className="text-xs font-medium bg-emerald-50 text-emerald-600 rounded-full px-3 py-1 hover:bg-emerald-100 transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}

            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
              {blog.title}
            </h1>
            <p className="text-sm text-slate-400 mt-3">
              {formatDateOnly(blog.created_at)}
            </p>

            {coverUrl && (
              <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden mt-8 bg-slate-100">
                <Image
                  src={coverUrl}
                  alt={blog.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 700px"
                  className="object-cover"
                  priority
                />
              </div>
            )}

            <div
              className="blog-content mt-8"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
          </article>

          <aside className="lg:w-[40%]">
            <div className="lg:sticky lg:top-8">
              <BlogSidebar
                recentPosts={recentPosts}
                categories={allCategories}
                showSearch={false}
              />
            </div>
          </aside>
        </div>

        {/* <div className="mt-14">
          <BlogCTA />
        </div> */}
      </div>
    </div>
  );
}
