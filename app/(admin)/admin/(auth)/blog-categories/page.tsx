import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { getCategoriesWithCounts } from "@/lib/blog";
import { deleteCategory } from "./_actions";
import { DeleteButton } from "../_components/DeleteButton";

export default async function BlogCategoriesPage() {
  const categories = await getCategoriesWithCounts();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Blog Categories</h1>
          <p className="text-sm text-gray-400 mt-1">{categories.length} total</p>
        </div>
        <Link
          href="/admin/blog-categories/new"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          New Category
        </Link>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left text-gray-400">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Posts</th>
              <th className="px-4 py-3 font-medium w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-b border-gray-800 last:border-0">
                <td className="px-4 py-3 text-gray-200">{cat.name}</td>
                <td className="px-4 py-3 text-gray-500">{cat.slug}</td>
                <td className="px-4 py-3 text-gray-400">{cat.count}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/blog-categories/${cat.id}/edit`}
                      className="text-gray-400 hover:text-emerald-400 transition-colors"
                    >
                      <Pencil size={15} />
                    </Link>
                    <DeleteButton
                      action={deleteCategory.bind(null, cat.id)}
                      confirmMessage={`Delete category "${cat.name}"? This cannot be undone.`}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  No categories yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
