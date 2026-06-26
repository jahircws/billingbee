"use server"
import db from "@/lib/db"
import { getOrgId } from "@/lib/session"

export async function saveOnboardingGoal(goal: string) {
  const orgId = await getOrgId()
  await db.organization.update({
    where: { id: orgId },
    data: { onboardingGoal: goal },
  })
}

export async function completeOnboarding() {
  const orgId = await getOrgId()
  await db.organization.update({
    where: { id: orgId },
    data: { onboardingDone: true },
  })
}
