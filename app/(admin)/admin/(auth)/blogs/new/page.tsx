import { prisma } from "@/lib/prisma";
import { BlogForm } from "../_components/BlogForm";

export default async function NewBlogPage() {
  const categories = await prisma.blogCategory.findMany({ orderBy: { name: "asc" } });
  return <BlogForm categories={categories} />;
}
