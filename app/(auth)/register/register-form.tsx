"use client"

import { useActionState, useEffect, useRef } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { registerOrg } from "@/app/actions/auth"
import { PhoneOtpFlow } from "@/components/phone-otp-flow"

export function RegisterForm({ callbackUrl, trial, isIndia }: { callbackUrl?: string; trial?: string; isIndia?: boolean }) {
  const isProTrial = trial === "pro"
  const [state, action, pending] = useActionState(registerOrg, undefined)
  const acqRef = useRef<HTMLInputElement>(null)
  const pendingDocRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem("bb_acquisition")
      if (raw && acqRef.current) {
        const { source, campaign, from } = JSON.parse(raw)
        acqRef.current.value = campaign || from || source || ""
      }
    } catch { /* ignore */ }

    try {
      const pendingDoc = localStorage.getItem("bb_pending_doc")
      if (pendingDoc && pendingDocRef.current) {
        pendingDocRef.current.value = pendingDoc
      }
    } catch { /* ignore */ }
  }, [])

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Create your account</h2>
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: "#10b981" }}
          >
            {isProTrial ? "Pro trial" : "Free"}
          </span>
        </div>
        <p className="text-gray-500 text-sm">
          {isProTrial
            ? "Starting your 14-day Pro trial — no credit card required"
            : "No credit card required · Set up in under 2 minutes"}
        </p>
      </div>

      {isIndia && (
        <>
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sign up with mobile</p>
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

      {state?.honeypot && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
          <p className="text-sm text-emerald-700">
            Almost there! We sent a verification link to your email — please check your inbox to activate your account.
          </p>
        </div>
      )}

      <form
        key={state?.error ? "retry" : "initial"}
        action={action}
        className="space-y-5"
        onSubmit={() => {
          try { localStorage.removeItem("bb_pending_doc") } catch { /* ignore */ }
        }}
      >
        {/* Honeypot — hidden from real users, bots fill it */}
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0 }} />
        <input ref={acqRef} type="hidden" name="acquisitionSource" />
        <input ref={pendingDocRef} type="hidden" name="pendingDoc" />
        {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
        {isProTrial && <input type="hidden" name="trial" value="pro" />}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="orgName" className="text-sm font-medium text-gray-700">
              Business name
            </Label>
            <span className="text-xs text-gray-400">Optional</span>
          </div>
          <Input
            id="orgName"
            name="orgName"
            type="text"
            autoComplete="organization"
            placeholder="Leave blank if you don't have a business name"
            defaultValue={state?.values?.orgName ?? ""}
            className="h-11 text-base"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
            Your name
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Jane Doe"
            required
            defaultValue={state?.values?.name ?? ""}
            className="h-11 text-base"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Work email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="jane@acme.com"
            required
            defaultValue={state?.values?.email ?? ""}
            className="h-11 text-base"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              placeholder="8+ chars, letter & number"
              required
              className="h-11 text-base"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              Confirm
            </Label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="Repeat password"
              required
              className="h-11 text-base"
            />
          </div>
        </div>

        <div className="flex items-start gap-3">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            required
            className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-emerald-500 cursor-pointer"
          />
          <Label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed cursor-pointer">
            I agree to the{" "}
            <Link href="/terms-service" className="underline" style={{ color: "#10b981" }}>
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="underline" style={{ color: "#10b981" }}>
              Privacy Policy
            </Link>
          </Label>
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
          {pending ? "Creating account…" : isProTrial ? "Start 14-day Pro trial" : "Create free account"}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold hover:underline" style={{ color: "#10b981" }}>
          Sign in
        </Link>
      </p>
    </div>
  )
}
