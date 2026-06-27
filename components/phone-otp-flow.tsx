"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth"
import { firebaseAuth } from "@/lib/firebase-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Props {
  callbackUrl?: string
}

type Step = "phone" | "otp"

const RESEND_SECONDS = 30

export function PhoneOtpFlow({ callbackUrl }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<Step>("phone")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const confirmationRef = useRef<ConfirmationResult | null>(null)
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null)
  const recaptchaContainerRef = useRef<HTMLDivElement>(null)

  const cleanupRecaptcha = useCallback(() => {
    try { recaptchaRef.current?.clear() } catch { /* ignore */ }
    recaptchaRef.current = null
  }, [])

  useEffect(() => {
    return () => cleanupRecaptcha()
  }, [cleanupRecaptcha])

  useEffect(() => {
    if (resendTimer <= 0) return
    const id = setTimeout(() => setResendTimer((t) => t - 1), 1000)
    return () => clearTimeout(id)
  }, [resendTimer])

  const getRecaptcha = () => {
    if (recaptchaRef.current) return recaptchaRef.current
    const verifier = new RecaptchaVerifier(firebaseAuth, recaptchaContainerRef.current!, {
      size: "normal",
    })
    recaptchaRef.current = verifier
    return verifier
  }

  const handleSendOtp = async () => {
    setError("")
    if (!/^\d{10}$/.test(phone)) {
      setError("Please enter a valid 10-digit mobile number")
      return
    }
    setLoading(true)
    try {
      const verifier = getRecaptcha()
      const result = await signInWithPhoneNumber(firebaseAuth, `+91${phone}`, verifier)
      confirmationRef.current = result
      setStep("otp")
      setResendTimer(RESEND_SECONDS)
    } catch (err: unknown) {
      cleanupRecaptcha()
      const msg = err instanceof Error ? err.message : "Failed to send OTP"
      setError(msg.includes("too-many-requests") ? "Too many attempts. Please try again later." : "Failed to send OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    setError("")
    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter the 6-digit OTP")
      return
    }
    if (!confirmationRef.current) {
      setError("Session expired. Please resend OTP.")
      return
    }
    setLoading(true)
    try {
      const credential = await confirmationRef.current.confirm(otp)
      const idToken = await credential.user.getIdToken()

      const res = await fetch("/api/auth/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Verification failed")

      const result = await signIn("phone", {
        sessionToken: data.sessionToken,
        redirect: false,
      })
      if (result?.error) throw new Error("Sign-in failed")

      router.push(callbackUrl || data.redirectUrl || "/dashboard")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed"
      setError(msg.includes("invalid-verification-code") ? "Incorrect OTP. Please try again." : msg)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    cleanupRecaptcha()
    setOtp("")
    setError("")
    await handleSendOtp()
  }

  const handleChangeNumber = () => {
    cleanupRecaptcha()
    confirmationRef.current = null
    setStep("phone")
    setOtp("")
    setError("")
    setResendTimer(0)
  }

  if (step === "otp") {
    return (
      <div className="space-y-5">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-700">Enter OTP</p>
          <p className="text-xs text-gray-500">
            Sent to <span className="font-semibold">+91 {phone}</span>.{" "}
            <button
              type="button"
              onClick={handleChangeNumber}
              className="font-medium underline"
              style={{ color: "#10b981" }}
            >
              Change number
            </button>
          </p>
        </div>
        <Input
          type="tel"
          inputMode="numeric"
          maxLength={6}
          placeholder="6-digit OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="h-11 text-base tracking-widest"
          autoFocus
        />
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        <Button
          type="button"
          onClick={handleVerifyOtp}
          disabled={loading || otp.length !== 6}
          className="w-full h-11 text-sm font-semibold text-white rounded-lg"
          style={{ backgroundColor: loading || otp.length !== 6 ? "#6ee7b7" : "#10b981" }}
        >
          {loading ? "Verifying…" : "Verify OTP"}
        </Button>
        <p className="text-center text-xs text-gray-500">
          {resendTimer > 0 ? (
            <>Resend OTP in <span className="font-medium">{resendTimer}s</span></>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="font-medium underline"
              style={{ color: "#10b981" }}
            >
              Resend OTP
            </button>
          )}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-gray-700">Mobile number</Label>
        <div className="flex">
          <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 text-sm text-gray-600 select-none">
            +91
          </span>
          <Input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            className="h-11 text-base rounded-l-none"
          />
        </div>
      </div>
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      {/* reCAPTCHA container — must be in DOM when RecaptchaVerifier is created */}
      <div ref={recaptchaContainerRef} />
      <Button
        type="button"
        id="phone-signin-btn"
        onClick={handleSendOtp}
        disabled={loading || phone.length !== 10}
        className="w-full h-11 text-sm font-semibold text-white rounded-lg"
        style={{ backgroundColor: loading || phone.length !== 10 ? "#6ee7b7" : "#10b981" }}
      >
        {loading ? "Sending OTP…" : "Send OTP"}
      </Button>
    </div>
  )
}
