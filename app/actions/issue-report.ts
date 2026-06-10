"use server"

import prisma from "@/lib/db"
import { auth } from "@/auth"

interface LogIssueInput {
  type: "MANUAL" | "ERROR_404" | "ERROR_500"
  title: string
  description?: string
  url: string
  metadata?: Record<string, unknown>
}

export async function logIssue(input: LogIssueInput) {
  try {
    const session = await auth()
    await prisma.issueReport.create({
      data: {
        type: input.type,
        title: input.title,
        description: input.description ?? null,
        url: input.url,
        userId: session?.user?.userId ?? null,
        userName: session?.user?.name ?? null,
        userEmail: session?.user?.email ?? null,
        orgId: session?.user?.orgId ?? null,
        orgName: session?.user?.orgName ?? null,
        metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : undefined,
      },
    })
    return { ok: true }
  } catch {
    return { ok: false }
  }
}

export async function getMyIssues() {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) return []

  return prisma.issueReport.findMany({
    where: { orgId, type: "MANUAL" },
    orderBy: { createdAt: "desc" },
    take: 50,
  })
}
