import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/metadata";
import { getBlogsPage, getRecentPosts, getCategoriesWithCounts } from "@/lib/blog";
import { BlogCard } from "./_components/BlogCard";
import { BlogSidebar } from "./_components/BlogSidebar";
import { Pagination } from "./_components/Pagination";
import { MobileFilterDrawer } from "./_components/MobileFilterDrawer";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  ...generatePageMetadata(
    "Our Blog",
    "BillingBee: Explore our Insightful Blogs, Learn from Industry Experts, and Equip Your Business for Success - Start Your Journey Today!",
    "/blogs",
  ),
};

const PER_PAGE = 6;

export default async function BlogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; category?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const q = params.q?.trim() || undefined;
  const category = params.category || undefined;

  const [{ items, totalPages }, recentPosts, categories] = await Promise.all([
    getBlogsPage({ page, perPage: PER_PAGE, q, categorySlug: category }),
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
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
            Our Blog
          </h1>
          <p className="text-slate-500 mt-4 leading-relaxed">
            BillingBee: Explore our Insightful Blogs, Learn from Industry
            Experts, and Equip Your Business for Success — Start Your Journey
            Today!
          </p>
        </div>

        <MobileFilterDrawer>
          <BlogSidebar
            recentPosts={recentPosts}
            categories={categories}
            currentQuery={q}
          />
        </MobileFilterDrawer>

        <div className="flex flex-col lg:flex-row gap-10">
          <div className="lg:w-[60%]">
            {items.length === 0 ? (
              <p className="text-slate-400 text-center py-20">
                No articles found.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-6 items-stretch">
                {items.map((blog) => (
                  <BlogCard key={blog.id} blog={blog} />
                ))}
              </div>
            )}
            <Pagination page={page} totalPages={totalPages} params={{ q, category }} />
          </div>

          <aside className="hidden lg:block lg:w-[40%]">
            <div className="sticky top-8">
              <BlogSidebar
                recentPosts={recentPosts}
                categories={categories}
                currentQuery={q}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
