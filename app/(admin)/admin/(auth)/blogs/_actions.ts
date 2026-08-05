"use server";

// ⚠️ TODO: same as blog-categories/_actions.ts — no auth check yet. Add
// admin session verification before this ships.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { rm } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { saveMediaFile } from "@/lib/media-storage";

const MEDIA_MODEL_TYPE = "Blog";
const MEDIA_COLLECTION = "blog";
const COVER_WIDTH = 1080;
const COVER_HEIGHT = 630;

// Default legacy value, per the current schema requirement — always 1,
// not derived from the selected category.
const OLD_CATEGORY_DEFAULT = 1;

function emptyToNull(value: FormDataEntryValue | null): string | null {
  const str = value ? String(value).trim() : "";
  return str === "" ? null : str;
}

function getSelectedCategoryIds(formData: FormData): number[] {
  return formData
    .getAll("category_ids")
    .map((v) => Number(v))
    .filter((n) => !Number.isNaN(n));
}

/** Resizes/crops the uploaded cover image to exactly 1080x630 and stores it. */
async function replaceCoverImage(blogId: number, file: File) {
  const inputBuffer = Buffer.from(await file.arrayBuffer());

  const outputBuffer = await sharp(inputBuffer)
    .resize(COVER_WIDTH, COVER_HEIGHT, { fit: "cover", position: "centre" })
    .webp({ quality: 82 })
    .toBuffer();

  // Remove any existing cover for this blog first (files + db rows), so a
  // replaced image doesn't leave orphaned files/rows behind.
  const existing = await prisma.media.findMany({
    where: { model_type: MEDIA_MODEL_TYPE, model_id: BigInt(blogId), collection_name: MEDIA_COLLECTION },
  });
  for (const m of existing) {
    await rm(path.join(process.cwd(), "public", "uploads", "blog", String(m.id)), {
      recursive: true,
      force: true,
    });
  }
  await prisma.media.deleteMany({
    where: { model_type: MEDIA_MODEL_TYPE, model_id: BigInt(blogId), collection_name: MEDIA_COLLECTION },
  });

  const fileName = `cover-${Date.now()}.webp`;
  const media = await prisma.media.create({
    data: {
      model_type: MEDIA_MODEL_TYPE,
      model_id: BigInt(blogId),
      collection_name: MEDIA_COLLECTION,
      name: fileName,
      file_name: fileName,
      mime_type: "image/webp",
      disk: "public",
      size: BigInt(outputBuffer.length),
      order_column: 1,
    },
  });

  await saveMediaFile(outputBuffer, media.id, fileName);
}

export async function createBlog(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  if (!title) throw new Error("Title is required.");

  const slugInput = String(formData.get("slug") || "").trim();
  const slug = slugify(slugInput || title);

  const categoryIds = getSelectedCategoryIds(formData);

  const blog = await prisma.blog.create({
    data: {
      title,
      slug,
      content: String(formData.get("content") || ""),
      category: categoryIds.length ? JSON.stringify(categoryIds) : null,
      old_category: OLD_CATEGORY_DEFAULT,
      meta_title: emptyToNull(formData.get("meta_title")),
      meta_decription: emptyToNull(formData.get("meta_decription")),
      meta_key: emptyToNull(formData.get("meta_key")),
    },
  });

  const coverImage = formData.get("cover_image");
  if (coverImage instanceof File && coverImage.size > 0) {
    await replaceCoverImage(blog.id, coverImage);
  }

  revalidatePath("/admin/blogs");
  revalidatePath("/blogs");
  redirect("/admin/blogs");
}

export async function updateBlog(id: number, formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  if (!title) throw new Error("Title is required.");

  const slugInput = String(formData.get("slug") || "").trim();
  const slug = slugify(slugInput || title);

  const categoryIds = getSelectedCategoryIds(formData);

  await prisma.blog.update({
    where: { id },
    data: {
      title,
      slug,
      content: String(formData.get("content") || ""),
      category: categoryIds.length ? JSON.stringify(categoryIds) : null,
      meta_title: emptyToNull(formData.get("meta_title")),
      meta_decription: emptyToNull(formData.get("meta_decription")),
      meta_key: emptyToNull(formData.get("meta_key")),
      // old_category intentionally left untouched on edit.
    },
  });

  const coverImage = formData.get("cover_image");
  if (coverImage instanceof File && coverImage.size > 0) {
    await replaceCoverImage(id, coverImage);
  }

  revalidatePath("/admin/blogs");
  revalidatePath("/blogs");
  revalidatePath(`/blogs/${slug}`);
  redirect("/admin/blogs");
}

export async function deleteBlog(id: number) {
  const media = await prisma.media.findMany({
    where: { model_type: MEDIA_MODEL_TYPE, model_id: BigInt(id) },
  });
  for (const m of media) {
    await rm(path.join(process.cwd(), "public", "uploads", "blog", String(m.id)), {
      recursive: true,
      force: true,
    });
  }
  await prisma.media.deleteMany({ where: { model_type: MEDIA_MODEL_TYPE, model_id: BigInt(id) } });
  await prisma.blog.delete({ where: { id } });

  revalidatePath("/admin/blogs");
  revalidatePath("/blogs");
}
