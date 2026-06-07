"use server"

import { redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { addDays } from "date-fns"

interface LineItemInput {
  description: string
  quantity: number
  unitPrice: number
  taxRate?: number
}

interface QuoteInput {
  clientId: string
  expiryDate?: string
  currency?: string
  notes?: string
  terms?: string
  items: LineItemInput[]
}

export async function getQuotes(filters?: { status?: string; search?: string }) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  const where: Record<string, unknown> = { orgId }
  if (filters?.status) where.status = filters.status
  if (filters?.search) {
    where.OR = [
      { quoteNumber: { contains: filters.search, mode: "insensitive" } },
      { client: { name: { contains: filters.search, mode: "insensitive" } } },
    ]
  }

  const quotes = await prisma.quote.findMany({
    where,
    include: { client: { select: { id: true, name: true, email: true } } },
    orderBy: { issueDate: "desc" },
  })
  return quotes
}

export async function getQuote(quoteId: string) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  return prisma.quote.findUnique({
    where: { id: quoteId, orgId },
    include: {
      client: true,
      items: { orderBy: { sortOrder: "asc" } },
    },
  })
}

export async function createQuote(input: QuoteInput) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  const count = await prisma.quote.count({ where: { orgId } })
  const quoteNumber = `QUO-${String(count + 1).padStart(3, "0")}`

  const lineItems = input.items.map((item, idx) => {
    const subtotal = item.quantity * item.unitPrice
    const taxAmount = subtotal * ((item.taxRate ?? 0) / 100)
    return {
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate ?? 0,
      taxAmount,
      discount: 0,
      total: subtotal + taxAmount,
      sortOrder: idx,
    }
  })

  const subtotal = lineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const taxAmount = lineItems.reduce((s, i) => s + i.taxAmount, 0)
  const total = subtotal + taxAmount

  const quote = await prisma.quote.create({
    data: {
      orgId,
      clientId: input.clientId,
      quoteNumber,
      status: "DRAFT",
      issueDate: new Date(),
      expiryDate: input.expiryDate ? new Date(input.expiryDate) : addDays(new Date(), 30),
      currency: (input.currency ?? "INR") as never,
      subtotal,
      taxAmount,
      discountAmount: 0,
      total,
      notes: input.notes,
      terms: input.terms,
      items: { create: lineItems },
    },
  })

  return { quote }
}

export async function updateQuote(quoteId: string, data: Partial<QuoteInput> & { status?: string }) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  const existing = await prisma.quote.findUnique({ where: { id: quoteId, orgId } })
  if (!existing) return { error: "Not found" }

  const quote = await prisma.quote.update({
    where: { id: quoteId },
    data: {
      ...(data.expiryDate ? { expiryDate: new Date(data.expiryDate) } : {}),
      ...(data.currency ? { currency: data.currency as never } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.terms !== undefined ? { terms: data.terms } : {}),
      ...(data.status ? { status: data.status as never } : {}),
    },
  })
  return { quote }
}

export async function deleteQuote(quoteId: string) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  const existing = await prisma.quote.findUnique({ where: { id: quoteId, orgId } })
  if (!existing) return { error: "Not found" }

  await prisma.quote.delete({ where: { id: quoteId } })
  return { success: true }
}

export async function convertToInvoice(quoteId: string) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId, orgId },
    include: { items: true },
  })
  if (!quote) return { error: "Not found" }
  if (quote.status === "CONVERTED" as never) return { error: "Already converted" }

  const count = await prisma.invoice.count({ where: { orgId } })
  const invoiceNumber = `INV-${String(count + 1).padStart(3, "0")}`

  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { plan: true } })
  const autoFollowUp = org?.plan !== "free"

  const invoice = await prisma.invoice.create({
    data: {
      orgId,
      clientId: quote.clientId,
      invoiceNumber,
      status: "DRAFT",
      issueDate: new Date(),
      dueDate: addDays(new Date(), 30),
      currency: quote.currency,
      subtotal: quote.subtotal,
      taxAmount: quote.taxAmount,
      discountAmount: quote.discountAmount,
      total: quote.total,
      amountPaid: 0,
      amountDue: quote.total,
      notes: quote.notes,
      terms: quote.terms,
      autoFollowUp,
      items: {
        create: quote.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          discount: item.discount,
          total: item.total,
          sortOrder: item.sortOrder,
        })),
      },
    },
  })

  await prisma.quote.update({
    where: { id: quoteId },
    data: { status: "CONVERTED" as never },
  })

  return { invoice }
}
