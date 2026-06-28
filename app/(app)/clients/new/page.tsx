import { redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { privateMetadata } from "@/lib/metadata"
import ClientNewWrapper from "./ClientNewWrapper"

export const metadata = { ...privateMetadata, title: "New Client" }

interface Props {
  searchParams: Promise<{ onboarding?: string }>
}

export default async function ClientNewPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user?.orgId) redirect("/login")

  const { onboarding } = await searchParams
  const org = await prisma.organization.findUnique({ where: { id: session.user.orgId }, select: { currency: true } })
  const isIndia = org?.currency === "INR"

  return <ClientNewWrapper onboarding={onboarding === "true"} isIndia={isIndia} />
}
