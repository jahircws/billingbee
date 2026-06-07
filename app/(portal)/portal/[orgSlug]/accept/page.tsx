"use client"

import { useState, use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { acceptPortalInvite } from "@/app/actions/portal"
import { Suspense } from "react"

interface Props {
  params: Promise<{ orgSlug: string }>
}

function AcceptForm({ orgSlug }: { orgSlug: string }) {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError("Password must be at least 8 characters"); return }
    if (password !== confirm) { setError("Passwords do not match"); return }

    setLoading(true)
    setError("")

    const result = await acceptPortalInvite(token, password)
    if ("error" in result) { setError(result.error ?? "Failed"); setLoading(false); return }

    // Sign in automatically
    await signIn("client-password", {
      email: "",
      password,
      orgSlug,
      redirect: false,
    })

    router.push(`/portal/${orgSlug}/dashboard`)
  }

  if (!token) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600 font-medium">Invalid invite link.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Set your password</h1>
            <p className="text-sm text-gray-500 mt-1">Create a password to access your client portal</p>
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
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60 text-sm"
            >
              {loading ? "Setting up…" : "Access portal"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function AcceptPage({ params }: Props) {
  const { orgSlug } = use(params)
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><p className="text-gray-400">Loading…</p></div>}>
      <AcceptForm orgSlug={orgSlug} />
    </Suspense>
  )
}
