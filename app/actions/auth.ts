"use server"

import { hash } from "bcryptjs"
import { AuthError } from "next-auth"
import { signIn, signOut } from "@/auth"
import prisma from "@/lib/db"
import DOMPurify from "isomorphic-dompurify"
import { sendWelcomeEmail } from "@/lib/email"
import { validatePassword } from "@/lib/sanitize"
import { addDays } from "date-fns"

interface PendingDocItem {
  description: string
  qty: number
  rate: number
}

interface PendingDoc {
  docType: "invoice" | "quote"
  fromName: string
  toName: string
  toEmail?: string
  toCompany?: string
  issueDate?: string
  dueDate?: string
  items: PendingDocItem[]
  taxEnabled?: boolean
  taxRate?: string
  notes?: string
  paymentTerms?: string
}

function sanitize(value: unknown): string {
  if (typeof value !== "string") return ""
  return DOMPurify.sanitize(value.trim())
}

export async function registerOrg(_prevState: unknown, formData: FormData) {
  const rawOrgName = sanitize(formData.get("orgName"))
  const email = sanitize(formData.get("email")).toLowerCase()
  const password = sanitize(formData.get("password"))
  const name = sanitize(formData.get("name"))
  const callbackUrl = sanitize(formData.get("callbackUrl"))
  const trial = sanitize(formData.get("trial"))
  const orgName = rawOrgName || name

  const baseSlug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

  const confirmPassword = sanitize(formData.get("confirmPassword"))

  // Echoed back on error so the form keeps non-sensitive fields filled (passwords excluded)
  const values = { name, email, orgName: rawOrgName }

  if (!email || !password || !name || baseSlug.length < 2) {
    return { error: "Missing required fields", values }
  }

  const passwordError = validatePassword(password)
  if (passwordError) {
    return { error: passwordError, values }
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match", values }
  }

  // Parse pending doc from free tool if present
  let pendingDoc: PendingDoc | null = null
  try {
    const raw = formData.get("pendingDoc")
    if (raw && typeof raw === "string" && raw.startsWith("{")) {
      pendingDoc = JSON.parse(raw) as PendingDoc
    }
  } catch { /* ignore malformed data */ }

  let createdDocPath: string | null = null

  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return { error: "Email already in use", values }

    let orgSlug = baseSlug
    const slugTaken = await prisma.organization.findUnique({ where: { slug: orgSlug } })
    if (slugTaken) {
      orgSlug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`
    }

    const passwordHash = await hash(password, 12)
    const acquisitionSource = sanitize(formData.get("acquisitionSource")) || undefined

    // "Start Pro" on pricing opts into a 14-day Pro trial (no card). A trial is
    // simply plan=pro with a planExpiry date; lib/plan.ts downgrades to free
    // automatically once it passes.
    const trialData = trial === "pro" ? { plan: "pro", planExpiry: addDays(new Date(), 14) } : {}

    await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: orgName, slug: orgSlug, ...(acquisitionSource ? { acquisitionSource } : {}), ...trialData },
      })
      const user = await tx.user.create({
        data: { email, name, passwordHash },
      })
      await tx.orgUser.create({
        data: { orgId: org.id, userId: user.id, role: "OWNER" },
      })

      if (pendingDoc && pendingDoc.toName) {
        const client = await tx.client.create({
          data: {
            orgId: org.id,
            name: pendingDoc.toName,
            email: pendingDoc.toEmail || undefined,
            company: pendingDoc.toCompany || undefined,
          },
        })

        const taxRate = pendingDoc.taxEnabled ? parseFloat(pendingDoc.taxRate ?? "0") || 0 : 0
        const lineItems = (pendingDoc.items ?? []).filter((i) => i.description).map((i, idx) => {
          const subtotal = i.qty * i.rate
          const taxAmt = subtotal * (taxRate / 100)
          return {
            description: i.description,
            quantity: i.qty,
            unitPrice: i.rate,
            taxRate,
            taxAmount: taxAmt,
            discount: 0,
            total: subtotal + taxAmt,
            sortOrder: idx,
          }
        })

        const subtotal = lineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
        const taxAmount = lineItems.reduce((s, i) => s + i.taxAmount, 0)
        const total = subtotal + taxAmount
        const dueDate = pendingDoc.dueDate ? new Date(pendingDoc.dueDate) : addDays(new Date(), 30)

        if (pendingDoc.docType === "quote") {
          const count = await tx.quote.count({ where: { orgId: org.id } })
          const quoteNumber = `QUO-${String(count + 1).padStart(3, "0")}`
          const quote = await tx.quote.create({
            data: {
              orgId: org.id,
              clientId: client.id,
              quoteNumber,
              status: "DRAFT",
              issueDate: pendingDoc.issueDate ? new Date(pendingDoc.issueDate) : new Date(),
              expiryDate: dueDate,
              subtotal,
              taxAmount,
              total,
              notes: pendingDoc.notes || undefined,
              terms: pendingDoc.paymentTerms || undefined,
              items: { create: lineItems },
            },
          })
          createdDocPath = `/quotes/${quote.id}`
        } else {
          const count = await tx.invoice.count({ where: { orgId: org.id } })
          const invoiceNumber = `INV-${String(count + 1).padStart(3, "0")}`
          const invoice = await tx.invoice.create({
            data: {
              orgId: org.id,
              clientId: client.id,
              invoiceNumber,
              status: "DRAFT",
              issueDate: pendingDoc.issueDate ? new Date(pendingDoc.issueDate) : new Date(),
              dueDate,
              subtotal,
              taxAmount,
              total,
              amountDue: total,
              notes: pendingDoc.notes || undefined,
              terms: pendingDoc.paymentTerms || undefined,
              items: { create: lineItems },
            },
          })
          createdDocPath = `/invoices/${invoice.id}`
        }
      }
    })

    // Fire-and-forget welcome email
    sendWelcomeEmail(name, email, orgName).catch(() => {})
  } catch {
    return { error: "Registration failed. Please try again.", values }
  }

  const destination = createdDocPath ?? (callbackUrl || "/onboarding")
  await signIn("staff", { email, password, redirectTo: destination })
}

export async function loginStaff(_prevState: unknown, formData: FormData) {
  const email = sanitize(formData.get("email")).toLowerCase()
  const password = sanitize(formData.get("password"))
  const callbackUrl = sanitize(formData.get("callbackUrl")) || "/dashboard"

  try {
    await signIn("staff", { email, password, redirectTo: callbackUrl })
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
