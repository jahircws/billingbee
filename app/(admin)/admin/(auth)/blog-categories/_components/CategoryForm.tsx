import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createCategory, updateCategory } from "../_actions";

type CategoryFormData = {
  id?: number;
  name?: string;
  description?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_key?: string | null;
};

export function CategoryForm({ category }: { category?: CategoryFormData }) {
  const isEdit = Boolean(category?.id);
  const action = isEdit
    ? updateCategory.bind(null, category!.id!)
    : createCategory;

  return (
    <div className="p-8 max-w-2xl">
      <Link
        href="/admin/blog-categories"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors mb-6"
      >
        <ArrowLeft size={15} />
        Back to categories
      </Link>

      <h1 className="text-xl font-semibold text-white mb-6">
        {isEdit ? "Edit Category" : "New Category"}
      </h1>

      <form action={action} className="space-y-5">
        <Field label="Name" name="name" defaultValue={category?.name} required />
        <Field label="Description" name="description" defaultValue={category?.description} textarea />
        <Field label="Meta Title" name="meta_title" defaultValue={category?.meta_title} />
        <Field label="Meta Description" name="meta_description" defaultValue={category?.meta_description} textarea />
        <Field label="Meta Keywords" name="meta_key" defaultValue={category?.meta_key} placeholder="comma, separated, keywords" />

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            {isEdit ? "Save Changes" : "Create Category"}
          </button>
          <Link
            href="/admin/blog-categories"
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  textarea,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  textarea?: boolean;
  placeholder?: string;
}) {
  const common =
    "w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500";

  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      {textarea ? (
        <textarea
          name={name}
          defaultValue={defaultValue ?? ""}
          rows={3}
          placeholder={placeholder}
          className={common}
        />
      ) : (
        <input
          type="text"
          name={name}
          defaultValue={defaultValue ?? ""}
          required={required}
          placeholder={placeholder}
          className={common}
        />
      )}
    </div>
  );
}
