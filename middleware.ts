import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"
import { NextRequest, NextResponse } from "next/server"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const { auth } = NextAuth(authConfig)

const PUBLIC_PATHS = ["/", "/login", "/register", "/forgot-password", "/reset-password"]
const PUBLIC_PREFIXES = ["/pay/", "/blog/", "/free-invoice-", "/generate", "/api/webhooks/", "/api/auth/forgot-password", "/api/auth/reset-password", "/portal/"]

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
}

// Login rate limiter — 5 attempts per minute per IP (only active when Upstash is configured)
const loginRatelimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(5, "1 m"),
        prefix: "bb:login",
      })
    : null

async function applyLoginRateLimit(req: NextRequest): Promise<NextResponse | null> {
  if (!loginRatelimit) return null
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1"
  const { success } = await loginRatelimit.limit(ip)
  if (!success) {
    return NextResponse.json(
      { error: "Too many login attempts. Please wait a minute and try again." },
      { status: 429 }
    )
  }
  return null
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Rate-limit login attempts
  if (req.method === "POST" && pathname === "/api/auth/callback/credentials") {
    const limited = await applyLoginRateLimit(req)
    if (limited) return limited
  }

  if (pathname.startsWith("/admin/")) {
    if (pathname === "/admin/login") return NextResponse.next()
    const adminCookie = req.cookies.get("admin_session")
    if (!adminCookie?.value) {
      return NextResponse.redirect(new URL("/admin/login", req.url))
    }
    return NextResponse.next()
  }

  if (pathname.startsWith("/portal/")) {
    // Token-based contract signing — no session required
    if (pathname.startsWith("/portal/contract/")) return NextResponse.next()
    // Allow portal auth pages: login, forgot-password, reset-password
    if (/^\/portal\/[^/]+\/(login|forgot-password|reset-password|open)/.test(pathname)) return NextResponse.next()
    if (!session || session.user?.userType !== "CLIENT") {
      // Extract orgSlug from /portal/[orgSlug]/...
      const orgSlug = pathname.split("/")[2]
      const loginUrl = orgSlug ? `/portal/${orgSlug}/login` : "/login"
      return NextResponse.redirect(new URL(loginUrl, req.url))
    }
    return NextResponse.next()
  }

  if (pathname.startsWith("/dashboard/")) {
    if (!session || session.user?.userType !== "STAFF") {
      return NextResponse.redirect(new URL("/login", req.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)",
  ],
}
