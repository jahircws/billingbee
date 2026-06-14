"use client"

import { useState, use, useTransition } from "react"
import { requestClientMagicLink } from "@/app/actions/client-portal"

interface Props {
  params: Promise<{ orgSlug: string }>
}

export default function PortalLoginPage({ params }: Props) {
  const { orgSlug } = use(params)
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await requestClientMagicLink(orgSlug, email)
      setSent(true)
    })
  }

  if (sent) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Check your email</h2>
            <p className="text-sm text-gray-500 mt-1">
              We sent a sign-in link to <strong>{email}</strong>. Click it to access your portal.
            </p>
          </div>
          <p className="text-xs text-gray-400">The link expires in 7 days. Didn't get it? Check your spam folder.</p>
          <button
            onClick={() => setSent(false)}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Try a different email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Sign in to your portal</h1>
            <p className="text-sm text-gray-500 mt-1">Enter your email and we'll send you a sign-in link.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60 text-sm"
            >
              {isPending ? "Sending…" : "Send sign-in link"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
