import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { NextRequest, NextResponse } from "next/server"

function makeRateLimit(requests: number, window: "1 h") {
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
}

export async function checkRateLimit(
  req: NextRequest,
  type: keyof typeof limiters
): Promise<NextResponse | null> {
  const limiter = limiters[type]
  if (!limiter) return null

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "127.0.0.1"
  const { success } = await limiter.limit(ip)
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 })
  }
  return null
}
