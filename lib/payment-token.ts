import { createHmac, timingSafeEqual } from "crypto"

const SECRET = process.env.PAYMENT_TOKEN_SECRET ?? process.env.NEXTAUTH_SECRET ?? "fallback-secret"

interface TokenPayload {
  invoiceId: string
  orgId: string
  exp: number
}

export function generatePaymentToken(invoiceId: string, orgId: string, ttlDays = 90): string {
  const payload: TokenPayload = {
    invoiceId,
    orgId,
    exp: Math.floor(Date.now() / 1000) + ttlDays * 86400,
  }
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const sig = createHmac("sha256", SECRET).update(data).digest("base64url")
  return `${data}.${sig}`
}

export function verifyPaymentToken(token: string): TokenPayload {
  const lastDot = token.lastIndexOf(".")
  if (lastDot === -1) throw new Error("Malformed token")
  const data = token.slice(0, lastDot)
  const sig = token.slice(lastDot + 1)

  const expected = createHmac("sha256", SECRET).update(data).digest("base64url")
  const expectedBuf = Buffer.from(expected)
  const actualBuf = Buffer.from(sig)

  if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
    throw new Error("Invalid token signature")
  }

  const payload: TokenPayload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"))
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error("Token expired")
  return payload
}
