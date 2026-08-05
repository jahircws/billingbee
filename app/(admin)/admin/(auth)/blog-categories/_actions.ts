"use server";

// ⚠️ TODO: these actions currently perform no auth check. Add your admin
// session verification at the top of each exported function before this
// ships — e.g. `await requireAdminSession()` or whatever the equivalent is
// in this project's app/api/admin/login route. Without it, anyone who can
// reach these endpoints can create/edit/delete blog categories.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

export async function createCategory(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Name is required.");

  await prisma.blogCategory.create({
    data: {
      name,
      slug: slugify(name),
      description: emptyToNull(formData.get("description")),
      meta_title: emptyToNull(formData.get("meta_title")),
      meta_description: emptyToNull(formData.get("meta_description")),
      meta_key: emptyToNull(formData.get("meta_key")),
    },
  });

  revalidatePath("/admin/blog-categories");
  redirect("/admin/blog-categories");
}

export async function updateCategory(id: number, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Name is required.");

  await prisma.blogCategory.update({
    where: { id },
    data: {
      name,
      slug: slugify(name),
      description: emptyToNull(formData.get("description")),
      meta_title: emptyToNull(formData.get("meta_title")),
      meta_description: emptyToNull(formData.get("meta_description")),
      meta_key: emptyToNull(formData.get("meta_key")),
    },
  });

  revalidatePath("/admin/blog-categories");
  redirect("/admin/blog-categories");
}

export async function deleteCategory(id: number) {
  // Note: `blogs.category` is a JSON-array-of-ids text column, not a real
  // FK, so there's no DB constraint to violate here. Any blog still
  // referencing this id will simply stop showing it — parseCategoryIds()
  // + the findMany({ where: { id: { in: [...] } } }) lookups in lib/blog.ts
  // already tolerate dangling ids gracefully.
  await prisma.blogCategory.delete({ where: { id } });
  revalidatePath("/admin/blog-categories");
}

function emptyToNull(value: FormDataEntryValue | null): string | null {
  const str = value ? String(value).trim() : "";
  return str === "" ? null : str;
}
