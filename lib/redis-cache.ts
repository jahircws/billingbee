/**
 * Thin Redis cache helper using @upstash/redis.
 * Falls back to in-memory Map when UPSTASH_REDIS_REST_URL is not set
 * (dev / CI environments without Redis).
 */

import { Redis } from "@upstash/redis"

// ── Lazy Redis client ──────────────────────────────────────────────────────────

let _redis: Redis | null = null

function getRedis(): Redis | null {
  if (_redis) return _redis
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  _redis = Redis.fromEnv()
  return _redis
}

// ── In-memory fallback ────────────────────────────────────────────────────────

const mem = new Map<string, { value: string; exp: number }>()

function memGet(key: string): string | null {
  const e = mem.get(key)
  if (!e) return null
  if (Date.now() > e.exp) { mem.delete(key); return null }
  return e.value
}

function memSet(key: string, value: string, ttlSecs: number) {
  mem.set(key, { value, exp: Date.now() + ttlSecs * 1000 })
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis()
  if (redis) {
    const v = await redis.get<T>(key)
    return v ?? null
  }
  const raw = memGet(key)
  return raw ? (JSON.parse(raw) as T) : null
}

export async function cacheSet<T>(key: string, value: T, ttlSecs = 300): Promise<void> {
  const redis = getRedis()
  if (redis) {
    await redis.set(key, value, { ex: ttlSecs })
    return
  }
  memSet(key, JSON.stringify(value), ttlSecs)
}

export async function cacheDel(key: string): Promise<void> {
  const redis = getRedis()
  if (redis) {
    await redis.del(key)
    return
  }
  mem.delete(key)
}

export async function cacheGetOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSecs = 300,
): Promise<T> {
  const cached = await cacheGet<T>(key)
  if (cached !== null) return cached
  const fresh = await fetcher()
  await cacheSet(key, fresh, ttlSecs)
  return fresh
}
