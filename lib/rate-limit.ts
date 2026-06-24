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
