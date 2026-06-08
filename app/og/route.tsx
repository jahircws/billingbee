import { ImageResponse } from "next/og"
import type { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get("title") ?? "BillingBee — AI Invoicing for India"
  const subtitle = searchParams.get("sub") ?? "Create GST invoices in seconds. Get paid with Razorpay."

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          background: "#f0fdf4",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Top accent bar */}
        <div style={{ width: "1200px", height: "6px", background: "#059669", display: "flex" }} />

        {/* Logo row */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "40px 80px 0" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              background: "#059669",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "24px",
              fontWeight: "900",
            }}
          >
            B
          </div>
          <span style={{ fontSize: "28px", fontWeight: "800", color: "#111827" }}>BillingBee</span>
        </div>

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", padding: "40px 80px", flex: 1 }}>
          <div
            style={{
              fontSize: "62px",
              fontWeight: "900",
              color: "#111827",
              lineHeight: 1.1,
              maxWidth: "800px",
              marginBottom: "20px",
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: "26px", color: "#6b7280", maxWidth: "700px", lineHeight: 1.4 }}>
            {subtitle}
          </div>
        </div>

        {/* Badges */}
        <div style={{ display: "flex", gap: "12px", padding: "0 80px 50px", alignItems: "center" }}>
          <div
            style={{
              background: "#059669",
              color: "white",
              fontSize: "16px",
              fontWeight: "700",
              padding: "10px 20px",
              borderRadius: "100px",
              display: "flex",
            }}
          >
            Free to start
          </div>
          <div
            style={{
              background: "white",
              color: "#059669",
              fontSize: "16px",
              fontWeight: "600",
              padding: "10px 20px",
              borderRadius: "100px",
              border: "2px solid #d1fae5",
              display: "flex",
            }}
          >
            GST-compliant
          </div>
          <div
            style={{
              background: "white",
              color: "#059669",
              fontSize: "16px",
              fontWeight: "600",
              padding: "10px 20px",
              borderRadius: "100px",
              border: "2px solid #d1fae5",
              display: "flex",
            }}
          >
            Razorpay + Stripe
          </div>
          <div style={{ marginLeft: "auto", fontSize: "18px", color: "#9ca3af" }}>billingbee.co</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
