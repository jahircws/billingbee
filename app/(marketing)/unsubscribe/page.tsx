"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"

type State = "idle" | "loading" | "success" | "error"
type Reason = "irrelevant" | "frequent" | "forgot" | "other" | null

const REASONS: { label: string; value: NonNullable<Reason> }[] = [
  { label: "These emails aren't relevant to me", value: "irrelevant" },
  { label: "I'm receiving too many emails", value: "frequent" },
  { label: "I don't remember signing up", value: "forgot" },
  { label: "Another reason", value: "other" },
]

function UnsubscribeForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [reason, setReason] = useState<Reason>(null)
  const [state, setState] = useState<State>("idle")

  useEffect(() => {
    const param = searchParams.get("email")
    if (param) setEmail(decodeURIComponent(param))
  }, [searchParams])

  async function handleSubmit() {
    setState("loading")
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, reason }),
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
        background: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#1e2330",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <span style={{ color: "#10b981", fontSize: "22px", fontWeight: 800, letterSpacing: "-0.5px" }}>
          Billing<span style={{ color: "#ffffff" }}>Bee</span>
        </span>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 16px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "40px 36px",
            width: "100%",
            maxWidth: "520px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}
        >
          {state === "success" ? (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "#f0fdf9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                  fontSize: "26px",
                  color: "#10b981",
                }}
              >
                ✓
              </div>
              <h1 style={{ color: "#111827", fontSize: "22px", fontWeight: 700, margin: "0 0 12px" }}>
                You&apos;ve been unsubscribed.
              </h1>
              <p style={{ color: "#6b7280", fontSize: "15px", margin: 0, lineHeight: 1.6 }}>
                You won&apos;t receive marketing emails from BillingBee. Transactional emails (invoices, receipts) will still be sent.
              </p>
            </div>
          ) : state === "error" ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚠</div>
              <h1 style={{ color: "#dc2626", fontSize: "22px", fontWeight: 700, margin: "0 0 12px" }}>
                Something went wrong
              </h1>
              <p style={{ color: "#6b7280", fontSize: "15px", margin: 0, lineHeight: 1.6 }}>
                Please email us at{" "}
                <a href="mailto:amit@billingbee.co" style={{ color: "#10b981" }}>
                  amit@billingbee.co
                </a>{" "}
                and we&apos;ll remove you manually.
              </p>
            </div>
          ) : (
            <>
              <h1
                style={{
                  color: "#111827",
                  fontSize: "22px",
                  fontWeight: 700,
                  margin: "0 0 8px",
                  letterSpacing: "-0.3px",
                }}
              >
                We&apos;re sorry to see you go.
              </h1>
              <p style={{ color: "#6b7280", fontSize: "15px", margin: "0 0 28px", lineHeight: 1.6 }}>
                Before you go, help us understand why so we can do better.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
                {REASONS.map(({ label, value }) => {
                  const selected = reason === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setReason(value)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "14px 16px",
                        border: selected ? "2px solid #10b981" : "2px solid #e5e7eb",
                        borderRadius: "8px",
                        background: selected ? "#f0fdf9" : "#ffffff",
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: "15px",
                        color: "#111827",
                        transition: "border-color 0.15s, background 0.15s",
                      }}
                    >
                      <span
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "50%",
                          border: selected ? "5px solid #10b981" : "2px solid #d1d5db",
                          flexShrink: 0,
                          boxSizing: "border-box",
                        }}
                      />
                      {label}
                    </button>
                  )
                })}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={state === "loading"}
                  style={{
                    width: "100%",
                    padding: "12px 0",
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
                <button
                  type="button"
                  onClick={() => router.back()}
                  style={{
                    width: "100%",
                    padding: "12px 0",
                    background: "transparent",
                    color: "#374151",
                    border: "2px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "15px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Take me back
                </button>
              </div>
            </>
          )}
        </div>
      </div>
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
