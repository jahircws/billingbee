import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import prisma from "@/lib/db"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "staff",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email
        const password = credentials?.password
        if (typeof email !== "string" || typeof password !== "string") return null

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
          include: {
            orgUsers: {
              where: { isActive: true },
              include: { org: true },
              take: 1,
            },
          },
        })

        if (!user?.passwordHash) return null
        const valid = await compare(password, user.passwordHash)
        if (!valid) return null

        const orgUser = user.orgUsers[0]
        if (!orgUser) return null

        return {
          id: user.id,
          userId: user.id,
          email: user.email,
          name: user.name,
          orgId: orgUser.orgId,
          orgName: orgUser.org.name,
          orgSlug: orgUser.org.slug,
          role: orgUser.role,
          userType: "STAFF" as const,
        }
      },
    }),
    Credentials({
      id: "client",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        const token = credentials?.token
        if (typeof token !== "string") return null

        const portalUser = await prisma.clientPortalUser.findUnique({
          where: { token },
          include: { client: true },
        })

        if (!portalUser) return null
        if (portalUser.expiresAt < new Date()) return null

        return {
          id: portalUser.id,
          clientId: portalUser.clientId,
          orgId: portalUser.client.orgId,
          email: portalUser.email,
          userType: "CLIENT" as const,
        }
      },
    }),
    Credentials({
      id: "client-password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        orgSlug: { label: "OrgSlug", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email
        const password = credentials?.password
        const orgSlug = credentials?.orgSlug
        if (typeof email !== "string" || typeof password !== "string") return null

        const org = orgSlug
          ? await prisma.organization.findUnique({ where: { slug: orgSlug as string } })
          : null

        const portalUser = await prisma.clientPortalUser.findFirst({
          where: {
            email: email.toLowerCase().trim(),
            ...(org ? { client: { orgId: org.id } } : {}),
          },
          include: { client: true },
          orderBy: { createdAt: "desc" },
        })

        if (!portalUser?.passwordHash) return null
        const valid = await compare(password, portalUser.passwordHash)
        if (!valid) return null

        return {
          id: portalUser.id,
          clientId: portalUser.clientId,
          orgId: portalUser.client.orgId,
          email: portalUser.email,
          userType: "CLIENT" as const,
        }
      },
    }),
  ],
})
