import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMediaUrl } from "@/lib/blog";
import { BlogForm } from "../../_components/BlogForm";

export default async function EditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const blogId = Number(id);

  const [blog, categories] = await Promise.all([
    prisma.blog.findUnique({ where: { id: blogId } }),
    prisma.blogCategory.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!blog) notFound();

  const media = await prisma.media.findMany({
    where: { model_type: "Blog", model_id: BigInt(blogId), collection_name: "blog" },
    orderBy: { order_column: "asc" },
  });
  const existingCoverUrl = media.length > 0 ? getMediaUrl(media[0]) : null;

  return <BlogForm blog={blog} categories={categories} existingCoverUrl={existingCoverUrl} />;
}
