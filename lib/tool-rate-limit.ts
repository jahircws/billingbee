import prisma from "@/lib/db"

const WINDOW_MS = 60 * 60 * 1000 // 1 hour
const MAX_REQUESTS = 10

export async function checkToolRateLimit(ip: string, tool: string): Promise<{ allowed: boolean }> {
  const now = new Date()
  const record = await prisma.toolRateLimit.findUnique({ where: { ip_tool: { ip, tool } } })

  if (!record) {
    await prisma.toolRateLimit.create({ data: { ip, tool, count: 1, windowStart: now } })
    return { allowed: true }
  }

  const windowExpired = now.getTime() - record.windowStart.getTime() > WINDOW_MS

  if (windowExpired) {
    await prisma.toolRateLimit.update({
      where: { ip_tool: { ip, tool } },
      data: { count: 1, windowStart: now },
    })
    return { allowed: true }
  }

  if (record.count >= MAX_REQUESTS) {
    return { allowed: false }
  }

  await prisma.toolRateLimit.update({
    where: { ip_tool: { ip, tool } },
    data: { count: { increment: 1 } },
  })
  return { allowed: true }
}
