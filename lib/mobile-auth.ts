import { verifyMobileToken } from "@/lib/mobile-jwt"

export async function getMobileSession(request: Request): Promise<{ userId: string; orgId: string } | null> {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) return null
  const token = authHeader.slice(7)
  return verifyMobileToken(token)
}
