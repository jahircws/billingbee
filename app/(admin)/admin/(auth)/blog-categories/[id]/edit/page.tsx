import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "../../_components/CategoryForm";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = await prisma.blogCategory.findUnique({ where: { id: Number(id) } });
  if (!category) notFound();

  return <CategoryForm category={category} />;
}
