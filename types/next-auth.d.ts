import { DefaultSession, DefaultJWT } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      userId?: string
      orgId?: string
      orgName?: string
      orgSlug?: string
      role?: string
      userType?: "STAFF" | "CLIENT"
      clientId?: string
    } & DefaultSession["user"]
  }

  interface User {
    userId?: string
    orgId?: string
    orgName?: string
    orgSlug?: string
    role?: string
    userType?: "STAFF" | "CLIENT"
    clientId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    userId?: string
    orgId?: string
    orgName?: string
    orgSlug?: string
    role?: string
    userType?: "STAFF" | "CLIENT"
    clientId?: string
  }
}
