"use client"

import { useState, use } from "react"
import Link from "next/link"

interface Props {
  params: Promise<{ orgSlug: string }>
}

export default function ForgotPasswordPage({ params }: Props) {
  const { orgSlug } = use(params)
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await fetch("/api/portal/reset-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, orgSlug }),
      })
      setSent(true)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          {sent ? (
            <div className="text-center space-y-3">
              <div className="text-3xl">📬</div>
              <h1 className="text-lg font-bold text-gray-900">Check your email</h1>
              <p className="text-sm text-gray-500">
                If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link. Check your inbox.
              </p>
              <Link
                href={`/portal/${orgSlug}/login`}
                className="block text-sm text-emerald-600 hover:text-emerald-700 font-medium mt-4"
              >
                ← Back to login
              </Link>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Forgot password?</h1>
                <p className="text-sm text-gray-500 mt-1">Enter your email and we&apos;ll send you a reset link.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2.5 rounded-lg">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60 text-sm"
                >
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>

              <Link
                href={`/portal/${orgSlug}/login`}
                className="block text-center text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back to login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
