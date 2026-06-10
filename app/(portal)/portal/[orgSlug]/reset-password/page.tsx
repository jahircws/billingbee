"use client"

import { useState, use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

interface Props {
  params: Promise<{ orgSlug: string }>
}

export default function ResetPasswordPage({ params }: Props) {
  const { orgSlug } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError("Passwords do not match"); return }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/portal/reset-password/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Failed to reset password"); return }
      setDone(true)
      setTimeout(() => router.push(`/portal/${orgSlug}/login`), 2000)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-4">
          <p className="text-sm text-red-600">Invalid or missing reset link.</p>
          <Link href={`/portal/${orgSlug}/forgot-password`} className="text-sm text-emerald-600 underline">
            Request a new one
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          {done ? (
            <div className="text-center space-y-2">
              <div className="text-3xl">✅</div>
              <h1 className="text-lg font-bold text-gray-900">Password updated!</h1>
              <p className="text-sm text-gray-500">Redirecting you to login…</p>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Set new password</h1>
                <p className="text-sm text-gray-500 mt-1">Choose a new password for your portal account.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2.5 rounded-lg">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">New password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Confirm password</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    minLength={6}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60 text-sm"
                >
                  {loading ? "Updating…" : "Update password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
