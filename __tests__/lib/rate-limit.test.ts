import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// ── Set env vars AND create mockLimit before module initialization ─────────
// vi.hoisted runs before import statements, so the module sees the env vars.

const { mockLimit } = vi.hoisted(() => {
  process.env.UPSTASH_REDIS_REST_URL = "https://fake.upstash.io"
  process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token"
  const mockLimit = vi.fn()
  return { mockLimit }
})

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static slidingWindow = vi.fn().mockReturnValue({})
    limit = mockLimit
  },
}))

vi.mock("@upstash/redis", () => ({
  Redis: { fromEnv: vi.fn().mockReturnValue({}) },
}))

import { checkRateLimit } from "@/lib/rate-limit"

// ── Helpers ────────────────────────────────────────────────────────────────

function makeReq(ip = "1.2.3.4"): NextRequest {
  return new NextRequest("http://localhost/api/test", {
    headers: { "x-forwarded-for": ip },
  })
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("checkRateLimit", () => {
  beforeEach(() => mockLimit.mockReset())

  it("returns null when request is within limit", async () => {
    mockLimit.mockResolvedValue({ success: true })
    expect(await checkRateLimit(makeReq(), "ai")).toBeNull()
  })

  it("returns 429 NextResponse when limit is exceeded", async () => {
    mockLimit.mockResolvedValue({ success: false })
    const result = await checkRateLimit(makeReq(), "ai")
    expect(result).not.toBeNull()
    expect(result!.status).toBe(429)
  })

  it("429 body has user-friendly error — no internal class names", async () => {
    mockLimit.mockResolvedValue({ success: false })
    const body = await (await checkRateLimit(makeReq(), "ai"))!.json()
    expect(typeof body.error).toBe("string")
    expect(body.error.length).toBeGreaterThan(0)
    expect(body.error).not.toContain("Ratelimit")
    expect(body.error).not.toContain("upstash")
  })

  it("uses x-forwarded-for IP as the rate-limit key", async () => {
    mockLimit.mockResolvedValue({ success: true })
    await checkRateLimit(makeReq("5.6.7.8"), "ai")
    expect(mockLimit).toHaveBeenCalledWith("5.6.7.8")
  })

  it("uses first IP when x-forwarded-for has multiple IPs", async () => {
    mockLimit.mockResolvedValue({ success: true })
    const req = new NextRequest("http://localhost/api/test", {
      headers: { "x-forwarded-for": "10.0.0.1, 10.0.0.2, 10.0.0.3" },
    })
    await checkRateLimit(req, "ai")
    expect(mockLimit).toHaveBeenCalledWith("10.0.0.1")
  })

  it("uses custom key when provided, overriding IP", async () => {
    mockLimit.mockResolvedValue({ success: true })
    await checkRateLimit(makeReq("1.2.3.4"), "ai", "org:acme-123")
    expect(mockLimit).toHaveBeenCalledWith("org:acme-123")
  })

  it("falls back to 127.0.0.1 when no x-forwarded-for header", async () => {
    mockLimit.mockResolvedValue({ success: true })
    await checkRateLimit(new NextRequest("http://localhost/api/test"), "ai")
    expect(mockLimit).toHaveBeenCalledWith("127.0.0.1")
  })

  it("calls limit exactly once per request", async () => {
    mockLimit.mockResolvedValue({ success: true })
    await checkRateLimit(makeReq(), "ai")
    expect(mockLimit).toHaveBeenCalledTimes(1)
  })

  it("accepts all valid limiter types without throwing", async () => {
    mockLimit.mockResolvedValue({ success: true })
    const types = ["generate", "suggest", "pdf", "extract", "extractOrg", "ai"] as const
    for (const type of types) {
      await expect(checkRateLimit(makeReq(), type)).resolves.not.toThrow()
    }
  })
})
