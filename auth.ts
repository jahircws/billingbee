import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { compare } from "bcryptjs"
import { jwtVerify } from "jose"
import prisma from "@/lib/db"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  ...authConfig,
  callbacks: {
    session: authConfig.callbacks!.session!,
    async signIn({ account }) {
      // Allow all providers — org creation happens in jwt callback after
      // the Prisma adapter has written the User record to the DB.
      if (account?.provider === "google") return true
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        if ((user as { userType?: string }).userType) {
          // Credentials sign-in: custom fields already on user object
          token.userId = (user as { userId?: string }).userId
          token.orgId = (user as { orgId?: string }).orgId
          token.orgName = (user as { orgName?: string }).orgName
          token.orgSlug = (user as { orgSlug?: string }).orgSlug
          token.role = (user as { role?: string }).role
          token.userType = (user as { userType?: "STAFF" | "CLIENT" }).userType
          token.clientId = (user as { clientId?: string }).clientId
        }
      }

      // Google sign-in: user is in DB by the time jwt runs.
      // On first sign-in (!token.orgId), create org if none exists.
      if (account?.provider === "google" && !token.orgId) {
        const existingOrgUser = await prisma.orgUser.findFirst({
          where: { userId: token.sub! },
          include: { org: true },
        })

        if (!existingOrgUser) {
          const name = (token.name ?? token.email?.split("@")[0] ?? "My Business") as string
          const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "org"
          let orgSlug = baseSlug
          const slugTaken = await prisma.organization.findUnique({ where: { slug: orgSlug } })
          if (slugTaken) orgSlug = `${orgSlug}-${Math.random().toString(36).slice(2, 7)}`
          const org = await prisma.$transaction(async (tx) => {
            const created = await tx.organization.create({ data: { name, slug: orgSlug } })
            await tx.orgUser.create({ data: { orgId: created.id, userId: token.sub!, role: "OWNER" } })
            return created
          })
          token.userId = token.sub
          token.orgId = org.id
          token.orgName = org.name
          token.orgSlug = org.slug
          token.role = "OWNER"
          token.userType = "STAFF"
        } else {
          token.userId = token.sub
          token.orgId = existingOrgUser.orgId
          token.orgName = existingOrgUser.org.name
          token.orgSlug = existingOrgUser.org.slug
          token.role = existingOrgUser.role
          token.userType = "STAFF"
        }
      }

      return token
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
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

        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

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
      id: "client-token",
      credentials: {
        accessToken: { label: "AccessToken", type: "text" },
        orgSlug: { label: "OrgSlug", type: "text" },
      },
      async authorize(credentials) {
        const accessToken = credentials?.accessToken
        const orgSlug = credentials?.orgSlug
        if (typeof accessToken !== "string" || typeof orgSlug !== "string") return null

        const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET ?? "fallback-secret")
        let payload: { clientId: string; email: string; orgSlug: string }
        try {
          const result = await jwtVerify(accessToken, secret)
          payload = result.payload as typeof payload
        } catch {
          return null
        }

        if (payload.orgSlug !== orgSlug) return null

        const org = await prisma.organization.findUnique({ where: { slug: orgSlug } })
        if (!org) return null

        // Find or create the ClientPortalUser for this client
        let portalUser = await prisma.clientPortalUser.findFirst({
          where: { clientId: payload.clientId, email: payload.email.toLowerCase() },
          include: { client: true },
          orderBy: { createdAt: "desc" },
        })

        if (!portalUser) {
          // Auto-create portal account (no password — client uses forgot-password to set one later)
          const { randomBytes } = await import("crypto")
          portalUser = await prisma.clientPortalUser.create({
            data: {
              clientId: payload.clientId,
              email: payload.email.toLowerCase(),
              token: randomBytes(32).toString("hex"),
              expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            },
            include: { client: true },
          })
        }

        return {
          id: portalUser.id,
          clientId: portalUser.clientId,
          orgId: org.id,
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
