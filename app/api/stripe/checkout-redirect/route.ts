import { NextRequest, NextResponse } from "next/server"

export function GET(req: NextRequest) {
  // Simple redirect to the main checkout; the actual plan selection happens post-auth
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://billingbee.co"
  return NextResponse.redirect(`${base}/settings?tab=plan`)
}
