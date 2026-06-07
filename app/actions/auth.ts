"use server"

import { redirect } from "next/navigation"
import { hash } from "bcryptjs"
import { AuthError } from "next-auth"
import { signIn, signOut } from "@/auth"
import prisma from "@/lib/db"
import DOMPurify from "isomorphic-dompurify"
import { sendWelcomeEmail } from "@/lib/email"

function sanitize(value: unknown): string {
  if (typeof value !== "string") return ""
  return DOMPurify.sanitize(value.trim())
}

export async function registerOrg(_prevState: unknown, formData: FormData) {
  const orgName = sanitize(formData.get("orgName"))
  const orgSlug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  const email = sanitize(formData.get("email")).toLowerCase()
  const password = sanitize(formData.get("password"))
  const name = sanitize(formData.get("name"))

  const confirmPassword = sanitize(formData.get("confirmPassword"))

  if (!orgName || !email || !password || !name || orgSlug.length < 2) {
    return { error: "Missing required fields" }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" }
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" }
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return { error: "Email already in use" }

    const slugTaken = await prisma.organization.findUnique({ where: { slug: orgSlug } })
    if (slugTaken) return { error: "Slug already taken" }

    const passwordHash = await hash(password, 12)
    const acquisitionSource = sanitize(formData.get("acquisitionSource")) || undefined

    await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: orgName, slug: orgSlug, ...(acquisitionSource ? { acquisitionSource } : {}) },
      })
      const user = await tx.user.create({
        data: { email, name, passwordHash },
      })
      await tx.orgUser.create({
        data: { orgId: org.id, userId: user.id, role: "OWNER" },
      })
    })

    // Fire-and-forget welcome email
    sendWelcomeEmail(name, email, orgName).catch(() => {})
  } catch {
    return { error: "Registration failed. Please try again." }
  }

  redirect("/login")
}

export async function loginStaff(_prevState: unknown, formData: FormData) {
  const email = sanitize(formData.get("email")).toLowerCase()
  const password = sanitize(formData.get("password"))

  try {
    await signIn("staff", { email, password, redirectTo: "/dashboard" })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password" }
    }
    throw error
  }
}

export async function loginClient(_prevState: unknown, formData: FormData) {
  const token = sanitize(formData.get("token"))

  try {
    await signIn("client", { token, redirectTo: "/portal" })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid or expired access link" }
    }
    throw error
  }
}

export async function logout() {
  await signOut({ redirectTo: "/" })
}
