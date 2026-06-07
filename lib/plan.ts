import prisma from "@/lib/db"

const FREE_LIMITS = { invoices: 5, clients: 3 }

interface LimitCheck {
  allowed: boolean
  current: number
  limit: number | null // null = unlimited
}

// In-memory cache: key → { value, expiresAt }
const cache = new Map<string, { value: number; expiresAt: number }>()
const TTL_MS = 5 * 60 * 1000 // 5 min

function getCached(key: string): number | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null }
  return entry.value
}

function setCached(key: string, value: number) {
  cache.set(key, { value, expiresAt: Date.now() + TTL_MS })
}

export async function getActivePlan(orgId: string): Promise<"free" | "pro"> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { plan: true, planExpiry: true },
  })
  if (!org) return "free"
  if (org.plan === "pro") {
    if (!org.planExpiry || org.planExpiry > new Date()) return "pro"
  }
  return "free"
}

export async function checkInvoiceLimit(orgId: string): Promise<LimitCheck> {
  const plan = await getActivePlan(orgId)
  if (plan === "pro") return { allowed: true, current: 0, limit: null }

  const cacheKey = `inv_count:${orgId}`
  let current = getCached(cacheKey)
  if (current === null) {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    current = await prisma.invoice.count({
      where: { orgId, createdAt: { gte: startOfMonth } },
    })
    setCached(cacheKey, current)
  }

  const limit = FREE_LIMITS.invoices
  return { allowed: current < limit, current, limit }
}

export async function checkClientLimit(orgId: string): Promise<LimitCheck> {
  const plan = await getActivePlan(orgId)
  if (plan === "pro") return { allowed: true, current: 0, limit: null }

  const cacheKey = `client_count:${orgId}`
  let current = getCached(cacheKey)
  if (current === null) {
    current = await prisma.client.count({ where: { orgId } })
    setCached(cacheKey, current)
  }

  const limit = FREE_LIMITS.clients
  return { allowed: current < limit, current, limit }
}

export function invalidatePlanCache(orgId: string) {
  cache.delete(`inv_count:${orgId}`)
  cache.delete(`client_count:${orgId}`)
}
