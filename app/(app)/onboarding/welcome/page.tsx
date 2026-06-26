import { redirect } from "next/navigation"
import { getOrgId } from "@/lib/session"
import prisma from "@/lib/db"
import { auth } from "@/auth"
import WelcomeClient from "./WelcomeClient"

export default async function WelcomeOnboardingPage() {
  let orgId: string
  try {
    orgId = await getOrgId()
  } catch {
    redirect("/login")
  }

  const session = await auth()
  const firstName = session?.user?.name?.split(" ")[0] ?? "there"

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { onboardingGoal: true, onboardingDone: true },
  })

  if (org?.onboardingDone) {
    redirect("/dashboard")
  }

  return <WelcomeClient firstName={firstName} goal={org?.onboardingGoal ?? "invoices"} />
}
