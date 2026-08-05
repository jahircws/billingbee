"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Upload } from "lucide-react";
import { createBlog, updateBlog } from "../_actions";

type BlogFormData = {
  id?: number;
  title?: string;
  slug?: string;
  content?: string;
  category?: string | null;
  meta_title?: string | null;
  meta_decription?: string | null;
  meta_key?: string | null;
};

type CategoryOption = { id: number; name: string };

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

export function BlogForm({
  blog,
  categories,
  existingCoverUrl,
}: {
  blog?: BlogFormData;
  categories: CategoryOption[];
  existingCoverUrl?: string | null;
}) {
  const isEdit = Boolean(blog?.id);
  const action = isEdit ? updateBlog.bind(null, blog!.id!) : createBlog;

  const selectedCategoryIds = new Set(parseCategoryIds(blog?.category ?? null));
  const [preview, setPreview] = useState<string | null>(existingCoverUrl ?? null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  }

  return (
    <div className="p-8 max-w-3xl">
      <Link
        href="/admin/blogs"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors mb-6"
      >
        <ArrowLeft size={15} />
        Back to posts
      </Link>

      <h1 className="text-xl font-semibold text-white mb-6">
        {isEdit ? "Edit Post" : "New Post"}
      </h1>

      <form action={action} className="space-y-6">
        <Field label="Title" name="title" defaultValue={blog?.title} required />
        <Field
          label="Slug"
          name="slug"
          defaultValue={blog?.slug}
          placeholder="auto-generated from title if left blank"
        />

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Cover Image
            <span className="text-gray-600 font-normal"> — recommended 1080×630px, auto-cropped to fit</span>
          </label>
          {preview && (
            <div className="relative w-full max-w-sm aspect-[1080/630] rounded-lg overflow-hidden bg-gray-800 mb-3">
              <Image src={preview} alt="Cover preview" fill className="object-cover" unoptimized />
            </div>
          )}
          <label className="inline-flex items-center gap-2 text-sm text-gray-300 bg-gray-800 border border-gray-700 hover:border-emerald-500 rounded-lg px-4 py-2 cursor-pointer transition-colors w-fit">
            <Upload size={15} />
            {preview ? "Replace image" : "Upload image"}
            <input
              type="file"
              name="cover_image"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Categories</label>
          <div className="flex flex-wrap gap-x-5 gap-y-2 bg-gray-800/50 border border-gray-700 rounded-lg p-3">
            {categories.map((cat) => (
              <label key={cat.id} className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  name="category_ids"
                  value={cat.id}
                  defaultChecked={selectedCategoryIds.has(cat.id)}
                  className="rounded border-gray-600 bg-gray-800 text-emerald-600 focus:ring-emerald-500/40"
                />
                {cat.name}
              </label>
            ))}
            {categories.length === 0 && (
              <p className="text-sm text-gray-500">
                No categories yet —{" "}
                <Link href="/admin/blog-categories/new" className="text-emerald-400 hover:underline">
                  create one first
                </Link>
                .
              </p>
            )}
          </div>
        </div>

        <Field
          label="Content (HTML)"
          name="content"
          defaultValue={blog?.content}
          textarea
          rows={14}
          required
        />

        <Field label="Meta Title" name="meta_title" defaultValue={blog?.meta_title} />
        <Field label="Meta Description" name="meta_decription" defaultValue={blog?.meta_decription} textarea />
        <Field
          label="Meta Keywords"
          name="meta_key"
          defaultValue={blog?.meta_key}
          placeholder="comma, separated, keywords"
        />

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            {isEdit ? "Save Changes" : "Create Post"}
          </button>
          <Link
            href="/admin/blogs"
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
  rows = 3,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  textarea?: boolean;
  rows?: number;
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
          rows={rows}
          required={required}
          placeholder={placeholder}
          className={`${common} font-mono text-xs`}
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
