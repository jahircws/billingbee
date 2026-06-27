"use client"

import { useActionState } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { loginStaff } from "@/app/actions/auth"
import { PhoneOtpFlow } from "@/components/phone-otp-flow"

interface Props {
  callbackUrl?: string
  registered?: boolean
  isIndia?: boolean
}

export function LoginForm({ callbackUrl, registered, isIndia }: Props) {
  const [state, action, pending] = useActionState(loginStaff, undefined)

  return (
    <div className="space-y-8">
      {registered && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
          <p className="text-sm text-emerald-700 font-medium">Account created! Please sign in to get started.</p>
        </div>
      )}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back</h2>
        <p className="text-gray-500 text-sm">Sign in to your BillingBee account</p>
      </div>

      {isIndia && (
        <>
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Login with mobile</p>
            <PhoneOtpFlow callbackUrl={callbackUrl} />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: callbackUrl || "/dashboard" })}
        className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white py-3 text-sm font-medium text-gray-700 hover:bg-slate-50 transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <form action={action} className="space-y-5" suppressHydrationWarning>
        {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
        <div className="space-y-1.5" suppressHydrationWarning>
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email address
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            required
            className="h-11 text-base"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium hover:underline"
              style={{ color: "#10b981" }}
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            className="h-11 text-base"
          />
        </div>

        {state?.error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm text-red-600">{state.error}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={pending}
          className="w-full h-11 text-sm font-semibold text-white rounded-lg transition-colors"
          style={{ backgroundColor: pending ? "#6ee7b7" : "#10b981" }}
        >
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold hover:underline"
          style={{ color: "#10b981" }}
        >
          Create one free
        </Link>
      </p>
    </div>
  )
}
