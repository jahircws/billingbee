import { SignJWT, jwtVerify } from "jose"

const secret = () => new TextEncoder().encode(process.env.MOBILE_JWT_SECRET ?? "")

export async function signMobileToken(payload: { userId: string; orgId: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(secret())
}

export async function verifyMobileToken(token: string): Promise<{ userId: string; orgId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret())
    if (typeof payload.userId !== "string" || typeof payload.orgId !== "string") return null
    return { userId: payload.userId, orgId: payload.orgId }
  } catch {
    return null
  }
}
