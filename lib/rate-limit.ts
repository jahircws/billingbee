import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { NextRequest, NextResponse } from "next/server"

type Window = "1 m" | "1 h" | "1 d"

function makeRateLimit(requests: number, window: Window) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: "bb",
  })
}

const limiters = {
  generate: makeRateLimit(10, "1 h"),
  suggest: makeRateLimit(20, "1 h"),
  pdf: makeRateLimit(5, "1 h"),
  extract: makeRateLimit(10, "1 h"),       // public IP-based (anon /generate)
  extractOrg: makeRateLimit(10, "1 d"),    // authenticated org-based (/dashboard)
  ai: makeRateLimit(30, "1 h"),            // copilot — per org
  login: makeRateLimit(5, "1 m"),          // brute-force protection — per IP
  startupNames: makeRateLimit(10, "1 h"),  // public tool — per IP
  latePaymentEmail: makeRateLimit(10, "1 h"), // public tool — per IP
  register: makeRateLimit(3, "1 h"),       // bot/spam protection — per IP
  contact: makeRateLimit(5, "1 h"),        // contact form spam — per IP
}

// Fallback in-memory limiter used when Upstash is not configured.
const memoryStore = new Map<string, { count: number; resetAt: number }>()

function checkMemoryLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = memoryStore.get(key)
  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }
  if (entry.count >= max) return true
  entry.count++
  return false
}

// For server actions that don't have a NextRequest — accepts a raw IP string.
export async function checkRateLimitByIP(
  ip: string,
  type: keyof typeof limiters,
): Promise<boolean> {
  const limiter = limiters[type]
  if (!limiter) {
    // Upstash not configured — fall back to in-memory
    const limits: Record<string, { max: number; windowMs: number }> = {
      register: { max: 3, windowMs: 60 * 60 * 1000 },
      contact:  { max: 5, windowMs: 60 * 60 * 1000 },
    }
    const cfg = limits[type]
    if (!cfg) return false
    return checkMemoryLimit(`${type}:${ip}`, cfg.max, cfg.windowMs)
  }
  const { success } = await limiter.limit(ip)
  return !success
}

export async function checkRateLimit(
  req: NextRequest,
  type: keyof typeof limiters,
  customKey?: string,
): Promise<NextResponse | null> {
  const limiter = limiters[type]
  if (!limiter) return null

  const key = customKey ?? (req.headers.get("x-forwarded-for")?.split(",")[0] ?? "127.0.0.1")
  const { success } = await limiter.limit(key)
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 })
  }
  return null
}
