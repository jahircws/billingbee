import Link from "next/link"
import { Search, Home } from "lucide-react"
import { auth } from "@/auth"
import { headers } from "next/headers"
import prisma from "@/lib/db"

export default async function NotFound() {
  // Auto-log the 404 with user context
  try {
    const [session, hdrs] = await Promise.all([auth(), headers()])
    const url = hdrs.get("x-pathname") ?? hdrs.get("referer") ?? "unknown"
    await prisma.issueReport.create({
      data: {
        type: "ERROR_404",
        title: `404 — ${url}`,
        url,
        userId: session?.user?.userId ?? null,
        userName: session?.user?.name ?? null,
        userEmail: session?.user?.email ?? null,
        orgId: session?.user?.orgId ?? null,
        orgName: session?.user?.orgName ?? null,
      },
    })
  } catch {
    // never block the user-facing page
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <p className="text-8xl font-black text-gray-200 mb-4 select-none">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Page not found</h1>
        <p className="text-gray-500 mb-8">
          This page doesn&apos;t exist or may have been moved. Try searching or head back home.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700"
          >
            <Home className="h-4 w-4" />
            Go home
          </Link>
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300"
          >
            <Search className="h-4 w-4" />
            Create invoice
          </Link>
        </div>
      </div>
    </div>
  )
}
