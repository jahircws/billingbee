"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { serialize } from "@/lib/serialize"
import { scheduleCollections, cancelCollections, rescheduleCollections } from "@/app/actions/collections"
import { checkInvoiceLimit, invalidatePlanCache } from "@/lib/plan"
import { format, addDays } from "date-fns"
import { sendInvoiceSentEmail } from "@/lib/email"
import { generatePaymentToken } from "@/lib/payment-token"
import { computeInvoiceTotals } from "@/lib/invoice-totals"
import { getFxRate } from "@/lib/fx"
import { Currency } from "@/lib/generated/prisma/client"

interface LineItemInput {
  description: string
  hsn?: string
  quantity: number
  unitPrice: number
  taxRate?: number
  taxName?: string
  taxType?: string
  discount?: number
}

interface CreateInvoiceInput {
  clientId: string
  issueDate?: string
  dueDate?: string
  currency?: string
  notes?: string
  terms?: string
  items: LineItemInput[]
  autoFollowUp?: boolean
  isRecurring?: boolean
  recurringCron?: string
  discountAmount?: number
}

async function nextInvoiceNumber(orgId: string): Promise<string> {
  const invoices = await prisma.invoice.findMany({ where: { orgId }, select: { invoiceNumber: true } })
  const maxNum = invoices.reduce((max, inv) => {
    const m = inv.invoiceNumber.match(/(\d+)$/)
    return m ? Math.max(max, parseInt(m[1], 10)) : max
  }, 0)
  return `INV-${String(maxNum + 1).padStart(3, "0")}`
}

export async function createInvoice(input: CreateInvoiceInput) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  const limit = await checkInvoiceLimit(orgId)
  if (!limit.allowed) {
    return { error: "LIMIT_REACHED", current: limit.current, limit: limit.limit } as const
  }

  const invoiceNumber = await nextInvoiceNumber(orgId)

  const issueDate = input.issueDate ? new Date(input.issueDate) : new Date()
  const dueDate = input.dueDate
    ? new Date(input.dueDate)
    : addDays(issueDate, 30)

  // Compute totals (tax applied to the post-discount taxable base — see lib/invoice-totals)
  const totals = computeInvoiceTotals(input.items, input.discountAmount ?? 0)
  const lineItems = input.items.map((item, idx) => ({
    description: item.description,
    hsn: item.hsn?.trim() || null,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    taxRate: item.taxRate ?? 0,
    taxName: item.taxName ?? "GST",
    taxType: item.taxType ?? "PERCENTAGE",
    taxAmount: totals.lines[idx].taxAmount,
    discount: item.discount ?? 0,
    total: totals.lines[idx].total,
    sortOrder: 0,
  }))

  const { subtotal, taxAmount, discountAmount, total } = totals

  // Auto follow-up: Pro orgs get it on by default, free orgs get false
  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { plan: true, currency: true } })
  const isPro = org?.plan !== "free"
  const autoFollowUp = input.autoFollowUp ?? isPro

  // Freeze the FX rate from the invoice's currency → the org's base currency at
  // issue time, so health metrics can compare cross-currency totals later.
  // Falls back to 1 when no rate is available (same currency, or rates not yet
  // fetched) — additive and safe; a backfill can correct historical rows.
  const invoiceCurrency = (input.currency ?? "INR") as Currency
  const baseCurrency = org?.currency ?? "INR"
  const fxRate = (await getFxRate(invoiceCurrency, baseCurrency, issueDate)) ?? 1

  const invoice = await prisma.invoice.create({
    data: {
      orgId,
      clientId: input.clientId,
      invoiceNumber,
      status: "DRAFT",
      issueDate,
      dueDate,
      currency: invoiceCurrency as never,
      fxRate,
      subtotal,
      taxAmount,
      discountAmount,
      total,
      amountPaid: 0,
      amountDue: total,
      notes: input.notes,
      terms: input.terms,
      autoFollowUp,
      isRecurring: input.isRecurring ?? false,
      recurringCron: input.recurringCron ?? null,
      items: { create: lineItems },
    },
  })

  if (autoFollowUp && dueDate) {
    await scheduleCollections(orgId, invoice.id, dueDate)
  }

  invalidatePlanCache(orgId)
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

export async function updateInvoiceWithItems(invoiceId: string, input: CreateInvoiceInput) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  const existing = await prisma.invoice.findUnique({ where: { id: invoiceId, orgId } })
  if (!existing) return { error: "Not found" }

  const totals = computeInvoiceTotals(input.items, input.discountAmount ?? 0)
  const lineItems = input.items.map((item, idx) => ({
    description: item.description,
    hsn: item.hsn?.trim() || null,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    taxRate: item.taxRate ?? 0,
    taxName: item.taxName ?? "GST",
    taxType: item.taxType ?? "PERCENTAGE",
    taxAmount: totals.lines[idx].taxAmount,
    discount: item.discount ?? 0,
    total: totals.lines[idx].total,
    sortOrder: 0,
  }))

  const { subtotal, taxAmount, discountAmount, total } = totals

  const amountPaid = Number(existing.amountPaid)
  const amountDue = Math.max(0, total - amountPaid)

  // Re-resolve the frozen FX rate in case the currency or issue date changed.
  const effIssueDate = input.issueDate ? new Date(input.issueDate) : existing.issueDate
  const invoiceCurrency = (input.currency ?? "INR") as Currency
  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { currency: true } })
  const fxRate = (await getFxRate(invoiceCurrency, org?.currency ?? "INR", effIssueDate)) ?? 1

  await prisma.$transaction([
    prisma.invoiceItem.deleteMany({ where: { invoiceId } }),
    prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        clientId: input.clientId,
        currency: invoiceCurrency as never,
        fxRate,
        issueDate: input.issueDate ? new Date(input.issueDate) : existing.issueDate,
        dueDate: input.dueDate ? new Date(input.dueDate) : existing.dueDate,
        notes: input.notes ?? null,
        terms: input.terms ?? null,
        autoFollowUp: input.autoFollowUp ?? existing.autoFollowUp,
        isRecurring: input.isRecurring ?? existing.isRecurring,
        recurringCron: input.recurringCron ?? existing.recurringCron,
        subtotal,
        taxAmount,
        discountAmount,
        total,
        amountDue,
        items: { create: lineItems },
      },
    }),
  ])

  // Keep the follow-up schedule in sync with edits (skip paid invoices)
  if (existing.status !== "PAID") {
    const newDueDate = input.dueDate ? new Date(input.dueDate) : existing.dueDate
    const newAutoFollowUp = input.autoFollowUp ?? existing.autoFollowUp
    const dueDateChanged =
      !!input.dueDate && newDueDate?.getTime() !== existing.dueDate?.getTime()
    const followUpChanged =
      input.autoFollowUp !== undefined && input.autoFollowUp !== existing.autoFollowUp

    if (followUpChanged && !newAutoFollowUp) {
      await cancelCollections(orgId, invoiceId)
    } else if (newAutoFollowUp && newDueDate && (dueDateChanged || followUpChanged)) {
      await rescheduleCollections(orgId, invoiceId, newDueDate)
    }
  }

  return { invoiceId }
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

  // Keep the follow-up schedule in sync with due-date / autoFollowUp changes
  if (existing.status !== "PAID") {
    const newDueDate = data.dueDate ? new Date(data.dueDate) : existing.dueDate
    const newAutoFollowUp = data.autoFollowUp ?? existing.autoFollowUp
    const dueDateChanged =
      !!data.dueDate && newDueDate?.getTime() !== existing.dueDate?.getTime()
    const followUpChanged =
      data.autoFollowUp !== undefined && data.autoFollowUp !== existing.autoFollowUp

    if (data.status === "PAID") {
      await cancelCollections(orgId, invoiceId)
    } else if (followUpChanged && !newAutoFollowUp) {
      await cancelCollections(orgId, invoiceId)
    } else if (newAutoFollowUp && newDueDate && (dueDateChanged || followUpChanged)) {
      await rescheduleCollections(orgId, invoiceId, newDueDate)
    }
  }

  revalidatePath("/dashboard")
  revalidatePath("/invoices")
  revalidatePath(`/invoices/${invoiceId}`)
  return { invoice: serialize(updated) }
}

export async function deleteInvoice(invoiceId: string) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  const existing = await prisma.invoice.findUnique({ where: { id: invoiceId, orgId } })
  if (!existing) return { error: "Not found" }

  await prisma.invoice.delete({ where: { id: invoiceId } })
  revalidatePath("/dashboard")
  revalidatePath("/invoices")
  return { success: true }
}

export async function updateInvoiceStatus(invoiceId: string, status: string) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  const existing = await prisma.invoice.findUnique({ where: { id: invoiceId, orgId } })
  if (!existing) return { error: "Not found" }

  // Record a manual payment when transitioning to PAID (skip if already paid)
  const justMarkedPaid = status === "PAID" && existing.status !== "PAID"

  const [invoice] = await prisma.$transaction([
    prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: status as never,
        ...(status === "PAID" ? { amountPaid: existing.total, amountDue: 0, paidAt: new Date() } : {}),
      },
    }),
    ...(justMarkedPaid
      ? [
          prisma.payment.create({
            data: {
              orgId,
              invoiceId,
              clientId: existing.clientId,
              amount: existing.amountDue,
              currency: existing.currency,
              method: "OTHER",
              status: "captured",
              paidAt: new Date(),
              notes: "Marked paid manually",
            },
          }),
        ]
      : []),
  ])

  // Stop any pending follow-ups once the invoice is paid
  if (justMarkedPaid) {
    await cancelCollections(orgId, invoiceId)
  }

  revalidatePath("/dashboard")
  revalidatePath("/invoices")
  revalidatePath(`/invoices/${invoiceId}`)
  return { invoice: serialize(invoice) }
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

  const invoiceNumber = await nextInvoiceNumber(orgId)

  // New issue date → re-resolve the frozen FX rate for today.
  const dupIssueDate = new Date()
  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { currency: true } })
  const fxRate = (await getFxRate(source.currency, org?.currency ?? "INR", dupIssueDate)) ?? 1

  const invoice = await prisma.invoice.create({
    data: {
      orgId,
      clientId: source.clientId,
      invoiceNumber,
      status: "DRAFT",
      issueDate: dupIssueDate,
      dueDate: addDays(dupIssueDate, 30),
      currency: source.currency,
      fxRate,
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
          hsn: item.hsn,
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
  return { invoice: serialize(invoice) }
}

export async function sendInvoice(invoiceId: string, paymentUrl?: string) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId, orgId },
    include: {
      client: true,
      items: { orderBy: { sortOrder: "asc" } },
    },
  })
  if (!invoice) return { error: "Not found" }
  if (!invoice.client.email) return { error: "Client has no email address" }

  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { name: true } })
  const token = generatePaymentToken(invoice.id, orgId)
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://billingbee.co"
  const url = paymentUrl ?? `${base}/pay/${token}`

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: "UNPAID",
      sentAt: new Date(),
    },
  })

  // Re-anchor the follow-up sequence to the actual send. The schedule was laid
  // down at draft creation off the due date; if the invoice sat in draft past
  // its due date, anchor from today so reminders don't all fire at once.
  if (invoice.autoFollowUp && invoice.dueDate) {
    const anchor = invoice.dueDate > new Date() ? invoice.dueDate : new Date()
    await rescheduleCollections(orgId, invoiceId, anchor)
  }

  sendInvoiceSentEmail(
    {
      invoiceNumber: invoice.invoiceNumber,
      orgName: org?.name ?? "Your business",
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      total: Number(invoice.total),
      currency: invoice.currency,
      items: invoice.items.map((i) => ({
        description: i.description,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        total: Number(i.total),
      })),
    },
    invoice.client.name,
    invoice.client.email,
    url,
  ).catch(() => {})

  return { success: true }
}

export async function sendReminder(invoiceId: string) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId, orgId },
    include: {
      client: true,
      items: { orderBy: { sortOrder: "asc" } },
    },
  })
  if (!invoice) return { error: "Not found" }
  if (!invoice.client.email) return { error: "Client has no email address" }

  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { name: true } })
  const token = generatePaymentToken(invoice.id, orgId)
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://billingbee.co"
  const url = `${base}/pay/${token}`

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { reminderSentAt: new Date() },
  })

  sendInvoiceSentEmail(
    {
      invoiceNumber: invoice.invoiceNumber,
      orgName: org?.name ?? "Your business",
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      total: Number(invoice.total),
      currency: invoice.currency,
      items: invoice.items.map((i) => ({
        description: i.description,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        total: Number(i.total),
      })),
    },
    invoice.client.name,
    invoice.client.email,
    url,
  ).catch(() => {})

  return { success: true }
}
