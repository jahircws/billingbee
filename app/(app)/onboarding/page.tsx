import { redirect } from "next/navigation"
import { getOrgId } from "@/lib/session"
import prisma from "@/lib/db"
import GoalsClient from "./GoalsClient"

export default async function OnboardingPage() {
  let orgId: string
  try {
    orgId = await getOrgId()
  } catch {
    redirect("/login")
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { onboardingDone: true },
  })

  if (org?.onboardingDone) {
    redirect("/dashboard")
  }

  return <GoalsClient />
}
