"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

type State = "idle" | "loading" | "success" | "error"

function UnsubscribeForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [state, setState] = useState<State>("idle")

  useEffect(() => {
    const param = searchParams.get("email")
    if (param) setEmail(decodeURIComponent(param))
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState("loading")
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setState("success")
      } else {
        setState("error")
      }
    } catch {
      setState("error")
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#1e2330",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: "40px", textAlign: "center" }}>
        <span style={{ color: "#10b981", fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px" }}>
          Billing<span style={{ color: "#ffffff" }}>Bee</span>
        </span>
      </div>

      <div
        style={{
          background: "#262d3d",
          border: "1px solid #374151",
          borderRadius: "16px",
          padding: "40px 32px",
          width: "100%",
          maxWidth: "420px",
        }}
      >
        {state === "success" ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✓</div>
            <h1 style={{ color: "#10b981", fontSize: "22px", fontWeight: 700, margin: "0 0 12px" }}>
              You&apos;ve been unsubscribed
            </h1>
            <p style={{ color: "#9ca3af", fontSize: "15px", margin: "0 0 28px", lineHeight: 1.6 }}>
              You won&apos;t receive marketing emails from us anymore.
            </p>
            <Link
              href="/"
              style={{ color: "#10b981", fontSize: "15px", textDecoration: "none", fontWeight: 500 }}
            >
              Go back to BillingBee →
            </Link>
          </div>
        ) : state === "error" ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠</div>
            <h1 style={{ color: "#f87171", fontSize: "22px", fontWeight: 700, margin: "0 0 12px" }}>
              Something went wrong
            </h1>
            <p style={{ color: "#9ca3af", fontSize: "15px", margin: 0, lineHeight: 1.6 }}>
              Please email us at{" "}
              <a href="mailto:amit@billingbee.co" style={{ color: "#10b981" }}>
                amit@billingbee.co
              </a>{" "}
              and we&apos;ll remove you manually.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h1
              style={{
                color: "#ffffff",
                fontSize: "22px",
                fontWeight: 700,
                margin: "0 0 8px",
                letterSpacing: "-0.3px",
              }}
            >
              Unsubscribe from BillingBee emails
            </h1>
            <p style={{ color: "#9ca3af", fontSize: "14px", margin: "0 0 28px", lineHeight: 1.6 }}>
              Enter your email address below to stop receiving marketing emails from us.
            </p>

            <label style={{ display: "block", marginBottom: "6px", color: "#d1d5db", fontSize: "14px" }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "#1e2330",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: "20px",
              }}
            />

            <button
              type="submit"
              disabled={state === "loading"}
              style={{
                width: "100%",
                padding: "11px 0",
                background: state === "loading" ? "#059669" : "#10b981",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "15px",
                fontWeight: 600,
                cursor: state === "loading" ? "not-allowed" : "pointer",
                opacity: state === "loading" ? 0.7 : 1,
              }}
            >
              {state === "loading" ? "Unsubscribing…" : "Unsubscribe"}
            </button>
          </form>
        )}
      </div>

      <p style={{ color: "#4b5563", fontSize: "13px", marginTop: "24px" }}>
        BillingBee · billingbee.co
      </p>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense>
      <UnsubscribeForm />
    </Suspense>
  )
}
