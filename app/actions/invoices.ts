"use server"

import { redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { scheduleCollections } from "@/app/actions/collections"
import { format, addDays } from "date-fns"

interface LineItemInput {
  description: string
  quantity: number
  unitPrice: number
  taxRate?: number
}

interface CreateInvoiceInput {
  clientId: string
  dueDate?: string
  currency?: string
  notes?: string
  terms?: string
  items: LineItemInput[]
  autoFollowUp?: boolean
}

export async function createInvoice(input: CreateInvoiceInput) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  // Sequential invoice number
  const count = await prisma.invoice.count({ where: { orgId } })
  const invoiceNumber = `INV-${String(count + 1).padStart(3, "0")}`

  const dueDate = input.dueDate
    ? new Date(input.dueDate)
    : addDays(new Date(), 30)

  // Compute totals
  const lineItems = input.items.map((item) => {
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
      sortOrder: 0,
    }
  })

  const subtotal = lineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const taxAmount = lineItems.reduce((s, i) => s + i.taxAmount, 0)
  const total = subtotal + taxAmount

  // Auto follow-up: Pro orgs get it on by default, free orgs get false
  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { plan: true } })
  const isPro = org?.plan !== "free"
  const autoFollowUp = input.autoFollowUp ?? isPro

  const invoice = await prisma.invoice.create({
    data: {
      orgId,
      clientId: input.clientId,
      invoiceNumber,
      status: "UNPAID",
      issueDate: new Date(),
      dueDate,
      currency: (input.currency ?? "INR") as never,
      subtotal,
      taxAmount,
      discountAmount: 0,
      total,
      amountPaid: 0,
      amountDue: total,
      notes: input.notes,
      terms: input.terms,
      autoFollowUp,
      items: { create: lineItems },
    },
  })

  if (autoFollowUp && dueDate) {
    await scheduleCollections(orgId, invoice.id, dueDate)
  }

  return { invoiceId: invoice.id, invoiceNumber }
}

export async function getInvoices(filters?: {
  status?: string
  clientId?: string
  search?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  const page = filters?.page ?? 1
  const limit = filters?.limit ?? 50
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { orgId }
  if (filters?.status) where.status = filters.status
  if (filters?.clientId) where.clientId = filters.clientId
  if (filters?.from || filters?.to) {
    where.issueDate = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(filters.to) } : {}),
    }
  }
  if (filters?.search) {
    where.OR = [
      { invoiceNumber: { contains: filters.search, mode: "insensitive" } },
      { client: { name: { contains: filters.search, mode: "insensitive" } } },
    ]
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: { client: { select: { id: true, name: true, email: true } }, items: false },
      orderBy: { issueDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.invoice.count({ where }),
  ])

  return { invoices, total, page, limit }
}

export async function getInvoice(invoiceId: string) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId, orgId },
    include: {
      client: true,
      items: { orderBy: { sortOrder: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
      collectionEvents: { orderBy: { scheduledAt: "asc" } },
    },
  })
  return invoice
}

export async function updateInvoice(invoiceId: string, data: Partial<CreateInvoiceInput> & { status?: string }) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  const existing = await prisma.invoice.findUnique({ where: { id: invoiceId, orgId } })
  if (!existing) return { error: "Not found" }

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      ...(data.dueDate ? { dueDate: new Date(data.dueDate) } : {}),
      ...(data.currency ? { currency: data.currency as never } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.terms !== undefined ? { terms: data.terms } : {}),
      ...(data.autoFollowUp !== undefined ? { autoFollowUp: data.autoFollowUp } : {}),
      ...(data.status ? { status: data.status as never } : {}),
    },
  })
  return { invoice: updated }
}

export async function deleteInvoice(invoiceId: string) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  const existing = await prisma.invoice.findUnique({ where: { id: invoiceId, orgId } })
  if (!existing) return { error: "Not found" }

  await prisma.invoice.delete({ where: { id: invoiceId } })
  return { success: true }
}

export async function updateInvoiceStatus(invoiceId: string, status: string) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  const existing = await prisma.invoice.findUnique({ where: { id: invoiceId, orgId } })
  if (!existing) return { error: "Not found" }

  const invoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: status as never,
      ...(status === "PAID" ? { amountPaid: existing.total, amountDue: 0 } : {}),
    },
  })
  return { invoice }
}

export async function duplicateInvoice(invoiceId: string) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  const source = await prisma.invoice.findUnique({
    where: { id: invoiceId, orgId },
    include: { items: true },
  })
  if (!source) return { error: "Not found" }

  const count = await prisma.invoice.count({ where: { orgId } })
  const invoiceNumber = `INV-${String(count + 1).padStart(3, "0")}`

  const invoice = await prisma.invoice.create({
    data: {
      orgId,
      clientId: source.clientId,
      invoiceNumber,
      status: "DRAFT",
      issueDate: new Date(),
      dueDate: addDays(new Date(), 30),
      currency: source.currency,
      subtotal: source.subtotal,
      taxAmount: source.taxAmount,
      discountAmount: source.discountAmount,
      total: source.total,
      amountPaid: 0,
      amountDue: source.total,
      notes: source.notes,
      terms: source.terms,
      autoFollowUp: source.autoFollowUp,
      items: {
        create: source.items.map((item) => ({
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
  return { invoice }
}
