import Image from "next/image";
import Link from "next/link";
import { formatDateOnly } from "@/lib/format-date";
import type { BlogCardData } from "@/lib/blog";

export function BlogCard({ blog }: { blog: BlogCardData }) {
  return (
    <article className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-slate-300 transition-all duration-200">
      <div className="relative w-full aspect-[16/9] bg-slate-100 shrink-0">
        {blog.coverUrl ? (
          <Image
            src={blog.coverUrl}
            alt={blog.title}
            fill
            sizes="(max-width: 640px) 100vw, 400px"
            className="object-cover green-filter"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-sm">
            No image
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-5">
        <h3 className="font-semibold text-slate-900 text-lg leading-snug line-clamp-2 min-h-[2.75rem]">
          {blog.title}
        </h3>
        <p className="text-sm text-slate-500 mt-2 line-clamp-3 flex-1">
          {blog.excerpt}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {formatDateOnly(blog.created_at)}
          </span>
          <Link
            href={`/blogs/${blog.slug}`}
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            Read more →
          </Link>
        </div>
      </div>
    </article>
  );
}
