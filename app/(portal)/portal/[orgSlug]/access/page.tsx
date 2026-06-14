"use client"

import { use, useEffect, useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"

interface Props {
  params: Promise<{ orgSlug: string }>
}

function AutoLogin({ orgSlug }: { orgSlug: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("t")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) {
      router.replace(`/portal/${orgSlug}/login`)
      return
    }

    signIn("client-token", {
      accessToken: token,
      orgSlug,
      redirect: false,
    }).then((result) => {
      if (result?.error) {
        setError("This link has expired or is invalid. Please request a new sign-in link.")
        return
      }
      router.replace(`/portal/${orgSlug}/dashboard`)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-4">
          <p className="text-sm text-red-600">{error}</p>
          <a
            href={`/portal/${orgSlug}/login`}
            className="block text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Request a new link
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500">Signing you in…</p>
      </div>
    </div>
  )
}

export default function AccessPage({ params }: Props) {
  const { orgSlug } = use(params)
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    }>
      <AutoLogin orgSlug={orgSlug} />
    </Suspense>
  )
}
