import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = (user as { userId?: string }).userId
        token.orgId = (user as { orgId?: string }).orgId
        token.orgName = (user as { orgName?: string }).orgName
        token.orgSlug = (user as { orgSlug?: string }).orgSlug
        token.role = (user as { role?: string }).role
        token.userType = (user as { userType?: string }).userType
        token.clientId = (user as { clientId?: string }).clientId
      }
      return token
    },
    session({ session, token }) {
      session.user.userId = token.userId as string | undefined
      session.user.orgId = token.orgId as string | undefined
      session.user.orgName = token.orgName as string | undefined
      session.user.orgSlug = token.orgSlug as string | undefined
      session.user.role = token.role as string | undefined
      session.user.userType = token.userType as "STAFF" | "CLIENT" | undefined
      session.user.clientId = token.clientId as string | undefined
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig
