import { headers } from "next/headers"

interface GeoDefaults {
  currency: string
  country: string
}

export async function getGeoDefaults(): Promise<GeoDefaults> {
  try {
    const hdrs = await headers()
    const ip =
      hdrs.get("x-forwarded-for")?.split(",")[0].trim() ||
      hdrs.get("x-real-ip") ||
      null

    if (!ip || ip === "::1" || ip === "127.0.0.1") {
      return { currency: "USD", country: "US" }
    }

    const res = await fetch(`https://ip-api.com/json/${ip}?fields=countryCode`, {
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return { currency: "USD", country: "US" }

    const data = await res.json() as { countryCode?: string }
    if (data.countryCode === "IN") return { currency: "INR", country: "IN" }
    return { currency: "USD", country: "US" }
  } catch {
    return { currency: "USD", country: "US" }
  }
}
