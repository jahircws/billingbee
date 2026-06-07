"use client"

import { useEffect } from "react"
import * as Sentry from "@sentry/nextjs"
import Link from "next/link"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Something went wrong</h1>
          <p className="text-gray-500 mb-6">
            We&apos;re on it. Our team has been notified and will have this fixed shortly.
          </p>
          {error.digest && (
            <p className="text-xs text-gray-400 font-mono mb-6">Error ID: {error.digest}</p>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700"
            >
              Try again
            </button>
            <Link
              href="/dashboard"
              className="px-5 py-2.5 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300"
            >
              Go home
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
