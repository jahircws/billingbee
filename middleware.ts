import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

const PUBLIC_PATHS = ["/", "/login", "/register"]
const PUBLIC_PREFIXES = ["/pay/", "/blog/", "/api/webhooks/"]

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  if (pathname.startsWith("/admin/")) {
    if (pathname === "/admin/login") return NextResponse.next()
    const adminCookie = req.cookies.get("admin_session")
    if (!adminCookie?.value) {
      return NextResponse.redirect(new URL("/admin/login", req.url))
    }
    return NextResponse.next()
  }

  if (pathname.startsWith("/portal/")) {
    if (pathname === "/portal/login") return NextResponse.next()
    if (!session || session.user?.userType !== "CLIENT") {
      return NextResponse.redirect(new URL("/portal/login", req.url))
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
