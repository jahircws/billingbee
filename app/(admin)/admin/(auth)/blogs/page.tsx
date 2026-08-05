import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getMediaUrl, parseCategoryIds } from "@/lib/blog";
import { formatDateOnly } from "@/lib/format-date";
import { deleteBlog } from "./_actions";
import { DeleteButton } from "../_components/DeleteButton";

export default async function AdminBlogsPage() {
  const [blogs, categories] = await Promise.all([
    prisma.blog.findMany({ orderBy: { created_at: "desc" } }),
    prisma.blogCategory.findMany(),
  ]);

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const media = await prisma.media.findMany({
    where: {
      model_type: "Blog",
      collection_name: "blog",
      model_id: { in: blogs.map((b) => BigInt(b.id)) },
    },
    orderBy: { order_column: "asc" },
  });
  const coverMap = new Map<number, string>();
  for (const m of media) {
    const blogId = Number(m.model_id);
    if (!coverMap.has(blogId)) coverMap.set(blogId, getMediaUrl(m));
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Blog Posts</h1>
          <p className="text-sm text-gray-400 mt-1">{blogs.length} total</p>
        </div>
        <Link
          href="/admin/blogs/new"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          New Post
        </Link>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left text-gray-400">
              <th className="px-4 py-3 font-medium w-16"></th>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Categories</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {blogs.map((blog) => {
              const coverUrl = coverMap.get(blog.id);
              const catNames = parseCategoryIds(blog.category)
                .map((id) => categoryMap.get(id))
                .filter(Boolean);

              return (
                <tr key={blog.id} className="border-b border-gray-800 last:border-0">
                  <td className="px-4 py-3">
                    <div className="relative w-12 h-8 rounded overflow-hidden bg-gray-800 shrink-0">
                      {coverUrl ? (
                        <Image src={coverUrl} alt="" fill className="object-cover" />
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-200 max-w-xs truncate">{blog.title}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {catNames.length ? catNames.join(", ") : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDateOnly(blog.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/blogs/${blog.id}/edit`}
                        className="text-gray-400 hover:text-emerald-400 transition-colors"
                      >
                        <Pencil size={15} />
                      </Link>
                      <DeleteButton
                        action={deleteBlog.bind(null, blog.id)}
                        confirmMessage={`Delete "${blog.title}"? This cannot be undone.`}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
            {blogs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No blog posts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
