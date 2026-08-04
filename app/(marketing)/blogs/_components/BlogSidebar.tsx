import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { formatDateOnly } from "@/lib/format-date";

type RecentPost = {
  id: number;
  title: string;
  slug: string;
  created_at: Date;
  coverUrl: string | null;
};

type CategoryWithCount = {
  id: number;
  name: string;
  slug: string;
  count: number;
};

export function BlogSidebar({
  recentPosts,
  categories,
  showSearch = true,
  currentQuery,
}: {
  recentPosts: RecentPost[];
  categories: CategoryWithCount[];
  showSearch?: boolean;
  currentQuery?: string;
}) {
  return (
    <div className="space-y-8">
      {showSearch && (
        <form action="/blogs" method="get" className="flex">
          <input
            type="text"
            name="q"
            defaultValue={currentQuery}
            placeholder="Search articles…"
            className="flex-1 min-w-0 rounded-l-xl border border-slate-200 border-r-0 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          />
          <button
            type="submit"
            aria-label="Search"
            className="rounded-r-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 flex items-center justify-center transition-colors"
          >
            <Search size={16} />
          </button>
        </form>
      )}

      <div>
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">
          Recent posts
        </h3>
        <ul className="space-y-4">
          {recentPosts.map((post) => (
            <li key={post.id}>
              <Link href={`/blogs/${post.slug}`} className="flex gap-3 group">
                <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-slate-100">
                  {post.coverUrl ? (
                    <Image
                      src={post.coverUrl}
                      alt={post.title}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-[10px]">
                      No image
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                    {post.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {formatDateOnly(post.created_at)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
          {recentPosts.length === 0 && (
            <p className="text-sm text-slate-400">No posts yet.</p>
          )}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">
          Categories
        </h3>
        <ul className="space-y-2">
          {categories.map((cat) => (
            <li key={cat.id}>
              <Link
                href={`/blogs?category=${cat.slug}`}
                className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors"
              >
                <span className="text-sm text-slate-700">{cat.name}</span>
                <span className="text-xs font-medium bg-emerald-50 text-emerald-600 rounded-full px-2 py-0.5">
                  {cat.count}
                </span>
              </Link>
            </li>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-slate-400">No categories yet.</p>
          )}
        </ul>
      </div>
    </div>
  );
}
