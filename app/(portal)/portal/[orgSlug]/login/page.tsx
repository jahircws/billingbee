"use client"

import { useState, use } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

interface Props {
  params: Promise<{ orgSlug: string }>
}

export default function PortalLoginPage({ params }: Props) {
  const { orgSlug } = use(params)
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await signIn("client-password", {
      email,
      password,
      orgSlug,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError("Invalid email or password")
      return
    }

    router.push(`/portal/${orgSlug}/dashboard`)
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Client portal login</h1>
            <p className="text-sm text-gray-500 mt-1">Sign in to view your invoices and documents</p>
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
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60 text-sm"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="text-center">
            <a
              href={`/portal/${orgSlug}/forgot-password`}
              className="text-sm text-gray-500 hover:text-emerald-600 transition-colors"
            >
              Forgot password?
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
