"use client"

import { useActionState } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { registerOrg } from "@/app/actions/auth"

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerOrg, undefined)

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Create your account</h2>
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: "#10b981" }}
          >
            Free
          </span>
        </div>
        <p className="text-gray-500 text-sm">
          No credit card required &middot; Set up in under 2 minutes
        </p>
      </div>

      <form action={action} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="orgName" className="text-sm font-medium text-gray-700">
            Business name
          </Label>
          <Input
            id="orgName"
            name="orgName"
            type="text"
            autoComplete="organization"
            placeholder="Acme Consulting"
            required
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
            className="h-11 text-base"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="8+ characters"
              required
              className="h-11 text-base"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              Confirm
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
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
            <Link href="/terms" className="underline" style={{ color: "#10b981" }}>
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline" style={{ color: "#10b981" }}>
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
          {pending ? "Creating account…" : "Create free account"}
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
